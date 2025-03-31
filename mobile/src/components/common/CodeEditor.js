import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const CodeEditor = ({ value, onChange, placeholder }) => {
    return (
        <View style={styles.container}>
            <TextInput
                style={styles.textInput}
                multiline
                placeholder={placeholder || "Write your code here..."}
                value={value}
                onChangeText={onChange}
                textAlignVertical="top"
            />
        </View>
    );
};

CodeEditor.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string
};

CodeEditor.defaultProps = {
    value: '',
    placeholder: 'Write your code here...'
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    textInput: {
        height: 300,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        fontFamily: 'monospace',
    },
});

export default CodeEditor;