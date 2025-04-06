import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Constants from 'expo-constants';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useGoogleAuth } from '../../utils/clerkAuth';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';

// Server URL configuration - using environment variables
const SERVERURL = Constants.expoConfig?.extra?.API_URL || 'http://192.168.175.234:5000';

// Direct API calls to backend
const loginApi = {
    login: async (email, password) => {
        try {
            const response = await axios.post(`${SERVERURL}/api/auth/login`, {
                email,
                password
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Invalid credentials, try again.' 
            };
        }
    },
    
    googleLogin: async (googleData) => {
        try {
            const response = await axios.post(`${SERVERURL}/api/auth/login`, {
                email: googleData.email,
                googleId: googleData.sub,
                authType: 'google'
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Google login error:', error.response?.data || error.message);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Google login failed.',
                status: error.response?.status
            };
        }
    }
};

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const { googleSignIn } = useGoogleAuth();
    const { user: clerkUser } = useUser();
    const { signOut: clerkSignOut } = useClerkAuth();

    useEffect(() => {
        const checkExistingSession = async () => {
            if (clerkUser) {
                console.log("Active Clerk session detected:", clerkUser.id);
            }
        };
        
        checkExistingSession();
    }, [clerkUser]);

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorMsg('Please enter both email and password');
            return;
        }
        
        setErrorMsg('');
        setIsLoading(true);
        
        try {
            const result = await loginApi.login(email, password);
            
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
            console.error('Login error:', error);
            setErrorMsg('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setErrorMsg('');
            setIsLoading(true);
            
            if (clerkUser) {
                await clerkSignOut();
            }
            
            const googleAuthResult = await googleSignIn();
            
            if (googleAuthResult.success) {
                const loginResult = await loginApi.googleLogin(googleAuthResult.userData);
                
                if (loginResult.success) {
                    const { token, user } = loginResult.data;
                    await signIn(token, user);
                    
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                } else {
                    if (loginResult.status === 401) {
                        navigation.navigate('Register', { 
                            googleData: googleAuthResult.userData
                        });
                        return;
                    }
                    
                    setErrorMsg(loginResult.error);
                }
            } else {
                if (googleAuthResult.needsSignUp) {
                    navigation.navigate('Register', { 
                        googleAuthPending: true
                    });
                    return;
                }
                setErrorMsg(googleAuthResult.error);
            }
        } catch (err) {
            console.error('Google sign-in error:', err);
            setErrorMsg('Google sign-in failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert(
            "Reset Password",
            "This feature is coming soon. Please contact support if you need to reset your password.",
            [{ text: "OK" }]
        );
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
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Log in to your CodeMentor account</Text>
                </View>
                
                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
                
                <View style={styles.form}>
                    <TextInput 
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                    <TextInput 
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!isLoading}
                    />
                    
                    <TouchableOpacity 
                        style={styles.forgotPassword}
                        onPress={handleForgotPassword}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Log In</Text>
                        )}
                    </TouchableOpacity>
                    
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.googleButton}
                        onPress={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <FontAwesome name="google" size={24} color="#4285F4" style={styles.googleIcon} />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.link}>Sign Up</Text>
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
    forgotPassword: {
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    forgotPasswordText: {
        color: '#6200EE',
        fontSize: 14,
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
});

export default LoginScreen;