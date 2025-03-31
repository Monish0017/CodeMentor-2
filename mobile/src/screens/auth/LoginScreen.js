import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    
    const { signIn, signInWithGoogle, error, isLoading } = useAuth();

    // Update error message when auth context error changes
    useEffect(() => {
        if (error) {
            setErrorMsg(error);
        }
    }, [error]);

    const handleLogin = async () => {
        // Basic validation
        if (!email || !password) {
            setErrorMsg('Please enter both email and password');
            return;
        }
        
        // Clear any previous error
        setErrorMsg('');
        
        // Call sign in from context
        const result = await signIn(email, password);
        
        if (!result.success) {
            setErrorMsg(result.error);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithGoogle();
            if (!result.success) {
                setErrorMsg(result.error);
            }
        } catch (err) {
            setErrorMsg('Google sign-in failed. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
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
                
                <TouchableOpacity style={styles.forgotPassword}>
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
                
                <TouchableOpacity 
                    style={styles.googleButton}
                    onPress={handleGoogleLogin}
                    disabled={isLoading}
                >
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
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
    googleButton: {
        backgroundColor: '#FFFFFF',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCCCCC',
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