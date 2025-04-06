import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Audio from 'expo-av';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View as PlainView } from 'react-native'; // Import regular View for the header

// Server URL configuration
const SERVERURL = 'http://localhost:5000';

// Direct API calls to backend
const interviewSessionApi = {
    getInterview: async (interviewId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${SERVERURL}/api/interview/${interviewId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                return { success: true, interview: response.data.interview };
            } else {
                return { success: false, error: response.data.message || 'Failed to fetch interview' };
            }
        } catch (error) {
            console.error('Error fetching interview:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to load interview'
            };
        }
    },
    submitAnswer: async (interviewId, questionId, answer) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.post(`${SERVERURL}/api/interview/submit`,
                { interviewId, questionId, answer },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                return {
                    success: true,
                    feedback: response.data.feedback,
                    score: response.data.score
                };
            } else {
                return { success: false, error: response.data.message || 'Failed to submit answer' };
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to submit answer'
            };
        }
    },
    getInterviewFeedback: async (interviewId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.post(`${SERVERURL}/api/interview/feedback`,
                { interviewId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                return { success: true, feedback: response.data.feedback };
            } else {
                return { success: false, error: response.data.message || 'Failed to get feedback' };
            }
        } catch (error) {
            console.error('Error getting interview feedback:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to get interview feedback'
            };
        }
    },
    processVoiceInput: async (text) => {
        return text;
    }
};

const InterviewSessionScreen = ({ route, navigation }) => {
    const { interviewId, questions: initialQuestions } = route.params || {};
    const [interview, setInterview] = useState(null);
    const [questions, setQuestions] = useState(initialQuestions || []);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [answerFeedback, setAnswerFeedback] = useState(null);
    const [finalFeedback, setFinalFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState('');
    const [transcription, setTranscription] = useState('');
    const [recording, setRecording] = useState(null);
    const [questionTimer, setQuestionTimer] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (interviewId) {
            fetchInterview();
        } else {
            setLoading(false);
            Alert.alert(
                "Error",
                "No interview session found. Please start a new interview.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        }
    }, [interviewId]);

    useEffect(() => {
        if (!answerFeedback && !finalFeedback) {
            const interval = setInterval(() => {
                setQuestionTimer(prev => prev + 1);
            }, 1000);
            setTimerInterval(interval);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }).start();
            return () => clearInterval(interval);
        } else {
            clearInterval(timerInterval);
        }
    }, [currentQuestionIndex, answerFeedback, finalFeedback]);

    const fetchInterview = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await interviewSessionApi.getInterview(interviewId);
            if (response.success) {
                setInterview(response.interview);
                if (!initialQuestions && response.interview.questions) {
                    setQuestions(response.interview.questions.map(q => ({
                        id: q._id || q.id,
                        question: q.question,
                        studentAnswer: q.studentAnswer || '',
                        feedback: q.feedback || '',
                        score: q.questionScore || 0
                    })));
                }
                if (response.interview.status === 'Completed') {
                    setFinalFeedback(response.interview.feedback);
                }
            } else {
                setError(response.error);
            }
        } catch (err) {
            console.error('Error fetching interview:', err);
            setError('Failed to load interview data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                setError('Permission to record audio was denied');
                return;
            }
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                await recording.startAsync();
                setRecording(recording);
                setIsRecording(true);
                Speech.speak('Recording started. Speak your answer now.', {
                    language: 'en',
                    pitch: 1,
                    rate: 0.8,
                });
            } catch (prepError) {
                console.error('Error preparing recording:', prepError);
                setError('Could not start recording. Please check your device settings.');
            }
        } catch (err) {
            console.error('Failed to start recording', err);
            setError('Failed to start recording. Please try again.');
        }
    };

    const stopRecording = async () => {
        try {
            if (!recording) return;
            setIsRecording(false);
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            try {
                setTranscription('This is a simulated transcription of the recorded audio. In a real app, this would be actual transcribed text from a speech-to-text service.');

                setCurrentAnswer(prev => {
                    const newText = 'This is a simulated transcription of the recorded audio.';
                    return prev ? `${prev}\n\n${newText}` : newText;
                });

                setRecording(null);
            } catch (err) {
                console.error('Failed to process recording:', err);
                setError('Failed to process recording. Please try again.');
                setIsRecording(false);
                setRecording(null);
            }
        } catch (stopError) {
            console.error('Error stopping recording:', stopError);
            setError('Failed to process recording. Please try typing your answer instead.');
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSubmitAnswer = async () => {
        if (!currentAnswer.trim()) {
            Alert.alert("Error", "Please provide an answer before submitting");
            return;
        }
        try {
            setSubmitting(true);
            setError(null);
            const currentQuestion = questions[currentQuestionIndex];
            const response = await interviewSessionApi.submitAnswer(
                interviewId,
                currentQuestion.id,
                currentAnswer
            );

            if (response.success) {
                const updatedQuestions = [...questions];
                updatedQuestions[currentQuestionIndex] = {
                    ...updatedQuestions[currentQuestionIndex],
                    studentAnswer: currentAnswer,
                    feedback: response.feedback,
                    score: response.score
                };
                setQuestions(updatedQuestions);
                setAnswerFeedback({
                    score: response.score,
                    feedback: response.feedback,
                });
            } else {
                setError(response.error);
            }
        } catch (err) {
            console.error('Error submitting answer:', err);
            setError('Failed to submit answer. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setCurrentAnswer('');
            setAnswerFeedback(null);
        }
    };

    const handleCompleteInterview = async () => {
        try {
            setSubmitting(true);
            setError(null);
            const response = await interviewSessionApi.getInterviewFeedback(interviewId);
            if (response.success) {
                setFinalFeedback(response.feedback);
            } else {
                setError(response.error);
            }
        } catch (err) {
            console.error('Error completing interview:', err);
            setError('Failed to complete interview. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const allQuestionsAnswered = () => {
        return questions.every(q => q.studentAnswer);
    };

    const renderCurrentQuestion = () => {
        if (!questions || questions.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6200EE" />
                    <Text style={styles.loadingText}>Loading questions...</Text>
                </View>
            );
        }
        const currentQuestion = questions[currentQuestionIndex];
        return (
            <Animated.View style={[styles.questionPaper, { opacity: fadeAnim }]}>
                <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </Text>
                    <Text style={styles.timerText}>{formatTime(questionTimer)}</Text>
                </View>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
                <View style={styles.answerSection}>
                    <TextInput
                        style={styles.answerInput}
                        multiline
                        placeholder="Type your answer here..."
                        value={currentAnswer}
                        onChangeText={setCurrentAnswer}
                        editable={!answerFeedback && !submitting}
                    />
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[
                                styles.recordButton,
                                isRecording && styles.recordingButton,
                                (answerFeedback || submitting) && styles.disabledButton
                            ]}
                            onPress={toggleRecording}
                            disabled={!!answerFeedback || submitting}
                        >
                            <MaterialIcons
                                name={isRecording ? "mic-off" : "mic"}
                                size={24}
                                color={isRecording ? "#FFFFFF" : "#6200EE"}
                            />
                            <Text style={[
                                styles.recordButtonText,
                                isRecording && styles.recordingButtonText
                            ]}>
                                {isRecording ? "Stop Recording" : "Record Answer"}
                            </Text>
                        </TouchableOpacity>
                        {!answerFeedback ? (
                            <TouchableOpacity
                                style={[styles.submitButton, (submitting || !currentAnswer.trim()) && styles.disabledButton]}
                                onPress={handleSubmitAnswer}
                                disabled={submitting || !currentAnswer.trim()}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <MaterialIcons name="question-answer" size={20} color="#FFFFFF" />
                                        <Text style={styles.submitButtonText}>Submit Answer</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.nextButton, currentQuestionIndex >= questions.length - 1 && styles.disabledButton]}
                                onPress={handleNextQuestion}
                                disabled={currentQuestionIndex >= questions.length - 1}
                            >
                                <View style={styles.buttonContent}>
                                    <MaterialIcons name="check" size={20} color="#FFFFFF" />
                                    <Text style={styles.nextButtonText}>Next Question</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                {answerFeedback && (
                    <View style={styles.feedbackContainer}>
                        <View style={styles.feedbackHeader}>
                            <Text style={styles.feedbackTitle}>Feedback</Text>
                            <View style={styles.scoreContainer}>
                                <Text style={styles.scoreLabel}>Score:</Text>
                                <Text style={styles.scoreValue}>{answerFeedback.score}/10</Text>
                            </View>
                        </View>
                        <Text style={styles.feedbackText}>{answerFeedback.feedback}</Text>
                    </View>
                )}
            </Animated.View>
        );
    };

    const renderFinalFeedback = () => {
        if (!finalFeedback) return null;

        return (
            <View style={styles.finalFeedbackContainer}>
                {/* Replace LinearGradient with regular View */}
                <PlainView style={[styles.feedbackHeader, { backgroundColor: '#6200EE' }]}>
                    <Text style={styles.finalFeedbackTitle}>Interview Completed</Text>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.ratingLabel}>Overall Rating:</Text>
                        <Text style={styles.ratingValue}>{finalFeedback.overallRating}/10</Text>
                    </View>
                </PlainView>

                <View style={styles.feedbackSections}>
                    <View style={styles.feedbackSection}>
                        <Text style={styles.sectionTitle}>Strengths:</Text>
                        {finalFeedback.strengths.map((strength, idx) => (
                            <View key={idx} style={styles.feedbackItem}>
                                <Text style={styles.bulletPoint}>•</Text>
                                <Text style={styles.feedbackItemText}>{strength}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.feedbackDivider} />

                    <View style={styles.feedbackSection}>
                        <Text style={styles.sectionTitle}>Areas for Improvement:</Text>
                        {finalFeedback.weaknesses.map((weakness, idx) => (
                            <View key={idx} style={styles.feedbackItem}>
                                <Text style={styles.bulletPoint}>•</Text>
                                <Text style={styles.feedbackItemText}>{weakness}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.feedbackDivider} />

                    <View style={styles.feedbackSection}>
                        <Text style={styles.sectionTitle}>Summary:</Text>
                        <Text style={styles.summaryText}>{finalFeedback.summary}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.newInterviewButton}
                    onPress={() => navigation.navigate('AIInterview')}
                >
                    <Text style={styles.newInterviewButtonText}>Start a New Interview</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200EE" />
                <Text style={styles.loadingText}>Loading interview session...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {finalFeedback ? (
                <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.scrollContent}>
                    {renderFinalFeedback()}
                </ScrollView>
            ) : (
                <>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>
                            {interview?.type || 'Technical'} Interview - {interview?.difficulty || 'Intermediate'}
                        </Text>
                    </View>

                    {error && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorBannerText}>{error}</Text>
                        </View>
                    )}

                    <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.scrollContent}>
                        {renderCurrentQuestion()}
                        {allQuestionsAnswered() && currentQuestionIndex === questions.length - 1 && answerFeedback && (
                            <TouchableOpacity
                                style={[styles.completeButton, submitting && styles.disabledButton]}
                                onPress={handleCompleteInterview}
                                disabled={submitting}
                            >
                                <MaterialIcons name="assessment" size={20} color="#FFFFFF" />
                                <Text style={styles.completeButtonText}>
                                    Complete Interview & Get Feedback
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    mainScrollView: {
        flex: 1,
        ...(Platform.OS === 'web' && {
            overflowY: 'auto',
        }),
    },
    scrollContent: {
        flexGrow: 1,
        padding: Platform.OS === 'web' ? 16 : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666666',
    },
    headerContainer: {
        padding: 20,
        backgroundColor: '#6200EE',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    errorBanner: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        padding: 12,
        margin: 16,
        borderRadius: 8,
    },
    errorBannerText: {
        color: '#F44336',
        textAlign: 'center',
    },
    questionPaper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        margin: 16,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(98, 0, 238, 0.05)',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6200EE',
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        padding: 16,
        lineHeight: 26,
    },
    answerSection: {
        padding: 16,
        paddingTop: 0,
    },
    answerInput: {
        borderWidth: 1,
        borderColor: '#CCCCCC',
        borderRadius: 8,
        padding: 12,
        minHeight: 150,
        fontSize: 16,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 16,
    },
    recordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#6200EE',
        backgroundColor: 'transparent',
    },
    recordingButton: {
        backgroundColor: '#F44336',
        borderColor: '#F44336',
    },
    recordButtonText: {
        color: '#6200EE',
        fontWeight: '500',
        marginLeft: 8,
    },
    recordingButtonText: {
        color: '#FFFFFF',
    },
    submitButton: {
        backgroundColor: '#6200EE',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    nextButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    feedbackContainer: {
        backgroundColor: 'rgba(98, 0, 238, 0.05)',
        padding: 16,
        margin: 16,
        marginTop: 0,
        borderRadius: 8,
    },
    feedbackHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    feedbackTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666666',
        marginRight: 8,
    },
    scoreValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6200EE',
    },
    finalFeedbackContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        margin: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    finalFeedbackTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginRight: 8,
    },
    ratingValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    feedbackSections: {
        padding: 20,
    },
    feedbackSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 12,
    },
    feedbackItem: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    bulletPoint: {
        marginRight: 8,
        fontSize: 16,
        color: '#6200EE',
    },
    feedbackItemText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        color: '#333333',
    },
    feedbackDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 16,
    },
    summaryText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333333',
    },
    newInterviewButton: {
        backgroundColor: '#6200EE',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    newInterviewButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default InterviewSessionScreen;