import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Switch, Image, StyleSheet } from "react-native";
import axios from 'axios';

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [checked, setChecked] = useState(false);

    // axios.post(`http://192.168.1.161:5263/connect/token`).then((response) => {
    //     console.log(response.data);
    // });

    const onSubmitFormHandler = async () => {
        try {
            console.log("try");
            const formData = new URLSearchParams();
            formData.append("username", "bcrepin@supinfo.com");
            formData.append("password", "Soleil123!");
            formData.append("grant_type", "password");

            const response = await axios.post(
                "http://10.0.2.2:5263/connect/token",
                formData,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            if (response.status === 200 || response.status === 201) {
                console.log("Success", response.data);
                alert("Login successful");
            } else {
                throw new Error(`An error has occurred: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("An error has occurred");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.box}>
                <View>
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Sign in to your account to continue</Text>
                </View>

                <View style={styles.toggleContainer}>
                    <TouchableOpacity style={styles.toggleButtonActive}>
                        <Text style={styles.toggleTextActive}>Sign in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toggleButtonInactive}>
                        <Text style={styles.toggleTextInactive}>Sign up</Text>
                    </TouchableOpacity>
                </View>

                <View>
                    <Text>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View>
                    <Text>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <View style={styles.rememberContainer}>
                    <Switch value={checked} onValueChange={setChecked} />
                    <Text>Remember me</Text>
                </View>

                <TouchableOpacity style={styles.continueButton} onPress={onSubmitFormHandler}>
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>

                <Text style={styles.forgotPassword}>I forgot my password</Text>

                <View style={styles.separatorContainer}>
                    <View style={styles.separator} />
                    <Text style={styles.orText}>Or connect with</Text>
                    <View style={styles.separator} />
                </View>

                <View style={styles.socialButtons}>
                    <TouchableOpacity style={styles.socialButton}>
                        <Text>Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Text>Facebook</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default LoginScreen;

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
    },
    box: {
        width: "90%",
        padding: 20,
        backgroundColor: "white",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "gray",
        textAlign: "center",
        marginBottom: 20,
    },
    toggleContainer: {
        flexDirection: "row",
        backgroundColor: "#EEEEEE",
        borderRadius: 10,
        marginBottom: 20,
    },
    toggleButtonActive: {
        flex: 1,
        padding: 10,
        backgroundColor: "white",
        borderRadius: 10,
        alignItems: "center",
    },
    toggleButtonInactive: {
        flex: 1,
        padding: 10,
        backgroundColor: "transparent",
        alignItems: "center",
    },
    toggleTextActive: {
        fontWeight: "bold",
    },
    toggleTextInactive: {
        color: "black",
    },
    input: {
        borderWidth: 1,
        borderColor: "black",
        borderRadius: 5,
        padding: 10,
        marginTop: 5,
        marginBottom: 15,
    },
    rememberContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    continueButton: {
        backgroundColor: "#6B8AFD",
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: "center",
    },
    continueButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    forgotPassword: {
        color: "#6B8AFD",
        textAlign: "center",
        marginTop: 10,
    },
    separatorContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
    },
    separator: {
        flex: 1,
        height: 1,
        backgroundColor: "#ccc",
    },
    orText: {
        marginHorizontal: 10,
        color: "gray",
    },
    socialButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    socialButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: "black",
        borderRadius: 5,
        marginHorizontal: 5,
    },
    animation: {
        width: 200,
        height: 200,
        marginTop: 20,
    },
});
