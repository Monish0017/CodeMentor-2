import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Constants from 'expo-constants';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useGoogleAuth } from '../../utils/clerkAuth';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Server URL configuration - using environment variables
const SERVERURL = Constants.expoConfig?.extra?.API_URL || 'http://192.168.175.234:5000';

// Direct API calls to backend
const registerApi = {
    register: async (name, email, password, profileImage) => {
        try {
            const submitData = new FormData();
            submitData.append('name', name);
            submitData.append('email', email);
            submitData.append('password', password);
            submitData.append('authType', 'local');
            
            if (profileImage) {
                const localUri = profileImage.uri;
                const filename = localUri.split('/').pop();
                
                let type = 'image/jpeg'; // Default
                
                if (filename) {
                    const extension = filename.split('.').pop().toLowerCase();
                    switch (extension) {
                        case 'jpg':
                        case 'jpeg':
                            type = 'image/jpeg';
                            break;
                        case 'png':
                            type = 'image/png';
                            break;
                        case 'gif':
                            type = 'image/gif';
                            break;
                        case 'webp':
                            type = 'image/webp';
                            break;
                        default:
                            type = 'image/jpeg'; // Fallback to jpeg if unknown
                    }
                }
                
                submitData.append('profilePicture', {
                    uri: localUri,
                    name: filename,
                    type
                });
            }
            
            const response = await axios.post(`${SERVERURL}/api/auth/register`, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Registration error:', error.response?.data || error.message);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Registration failed. Please try again.' 
            };
        }
    },
    
    googleRegister: async (userData) => {
        try {
            const response = await axios.post(`${SERVERURL}/api/auth/register`, {
                name: userData.name,
                email: userData.email,
                googleId: userData.sub,
                profilePicture: userData.picture,
                authType: 'google'
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Google registration failed.' 
            };
        }
    }
};

const RegisterScreen = ({ navigation, route }) => {
    const { signIn } = useAuth();
    const { googleSignIn } = useGoogleAuth();
    const { user: clerkUser } = useUser();
    const { signOut: clerkSignOut } = useClerkAuth();
    const googleData = route.params?.googleData;
    
    const [name, setName] = useState(googleData?.name || '');
    const [email, setEmail] = useState(googleData?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(googleData?.picture || null);
    
    useEffect(() => {
        // Check for any pending auth or active sessions
        const checkSession = async () => {
            if (clerkUser && !googleData) {
                // We have a Clerk user but no Google data passed in from login screen
                console.log("Active Clerk session detected during registration");
            }
            
            if (route.params?.googleAuthPending) {
                setErrorMsg('Please complete Google authentication to continue');
            }
        };
        
        checkSession();
    }, [route.params?.googleAuthPending, clerkUser, googleData]);
    
    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                setErrorMsg('Permission to access photos is required!');
                return;
            }
            
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                exif: false,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                
                const fileExtension = selectedAsset.uri.split('.').pop().toLowerCase();
                const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                
                if (!validImageExtensions.includes(fileExtension)) {
                    setErrorMsg('Please select a valid image file (JPG, PNG, etc.)');
                    return;
                }
                
                setProfileImage(selectedAsset);
                setImagePreview(selectedAsset.uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            setErrorMsg('Failed to select profile image: ' + (error.message || 'Unknown error'));
        }
    };
    
    const removeImage = () => {
        setProfileImage(null);
        setImagePreview(googleData?.picture || null);
    };

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            setErrorMsg('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match');
            return;
        }

        setErrorMsg('');
        setIsLoading(true);
        
        try {
            const result = await registerApi.register(name, email, password, profileImage);
            
            if (result.success) {
                const { token, user } = result.data;
                await signIn(token, user);
                
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                });
            } else {
                setErrorMsg(result.error);
            }
        } catch (error) {
            console.error('Registration error:', error);
            setErrorMsg('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            if (googleData) {
                // If we already have Google data from the login screen, use it
                setIsLoading(true);
                
                const result = await registerApi.googleRegister(googleData);
                
                if (result.success) {
                    const { token, user } = result.data;
                    await signIn(token, user);
                    
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                } else {
                    setErrorMsg(result.error);
                }
                
                setIsLoading(false);
                return;
            }
            
            setErrorMsg('');
            setIsLoading(true);
            
            // Sign out from any existing Clerk session first
            if (clerkUser) {
                await clerkSignOut();
            }
            
            // Use Clerk's OAuth flow
            const googleAuthResult = await googleSignIn();
            
            if (googleAuthResult.success) {
                const registerResult = await registerApi.googleRegister(googleAuthResult.userData);
                
                if (registerResult.success) {
                    const { token, user } = registerResult.data;
                    await signIn(token, user);
                    
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                } else {
                    setErrorMsg(registerResult.error);
                }
            } else {
                setErrorMsg(googleAuthResult.error);
            }
        } catch (err) {
            console.error('Google sign-up error:', err);
            setErrorMsg('Google sign-up failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join CodeMentor and start acing interviews</Text>
                </View>

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <View style={styles.form}>
                    <View style={styles.profileImageContainer}>
                        <Text style={styles.profileImageLabel}>Profile Picture</Text>
                        
                        <TouchableOpacity 
                            style={styles.profileImagePicker} 
                            onPress={pickImage}
                        >
                            {imagePreview ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image 
                                        source={{ uri: imagePreview }} 
                                        style={styles.profileImagePreview} 
                                    />
                                    <TouchableOpacity 
                                        style={styles.removeImageButton}
                                        onPress={removeImage}
                                    >
                                        <Text style={styles.removeImageButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <FontAwesome name="camera" size={24} color="#666666" />
                                    <Text style={styles.uploadPlaceholderText}>Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        autoCapitalize="words"
                        value={name}
                        onChangeText={setName}
                        editable={!isLoading}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        editable={!isLoading}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoading && !googleData}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!isLoading && !googleData}
                    />
                    
                    {googleData ? (
                        <TouchableOpacity 
                            style={[styles.button, isLoading && styles.buttonDisabled]} 
                            onPress={handleGoogleSignup}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Complete Google Sign Up</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.button, isLoading && styles.buttonDisabled]} 
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Sign Up</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    {!googleData && (
                        <>
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.googleButton}
                                onPress={handleGoogleSignup}
                                disabled={isLoading}
                            >
                                <FontAwesome name="google" size={24} color="#4285F4" style={styles.googleIcon} />
                                <Text style={styles.googleButtonText}>Sign Up with Google</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
        ...(Platform.OS === 'web' && {
            overflowY: 'auto',
        }),
    },
    scrollContent: {
        padding: 20,
        flexGrow: 1,
    },
    backButton: {
        marginTop: 10,
        marginBottom: 20,
    },
    backButtonText: {
        fontSize: 16,
        color: '#6200EE',
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#6200EE',
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        marginTop: 8,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    form: {
        marginBottom: 30,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#CCCCCC',
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
    },
    button: {
        backgroundColor: '#6200EE',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#757575',
        fontSize: 14,
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCCCCC',
        flexDirection: 'row',
    },
    googleIcon: {
        marginRight: 10,
    },
    googleButtonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    footerText: {
        color: '#666666',
        marginRight: 5,
    },
    link: {
        color: '#6200EE',
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#9E9E9E',
    },
    profileImageContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    profileImageLabel: {
        fontSize: 16,
        marginBottom: 10,
        alignSelf: 'flex-start',
        color: '#666666',
    },
    profileImagePicker: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: '#CCCCCC',
    },
    profileImagePreview: {
        width: '100%',
        height: '100%',
    },
    imagePreviewContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    removeImageButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    uploadPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadPlaceholderText: {
        color: '#666666',
        fontSize: 14,
        marginTop: 8,
    },
});

export default RegisterScreen;