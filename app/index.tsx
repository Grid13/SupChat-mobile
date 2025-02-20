import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity, View,
} from 'react-native';
// import {Formik} from 'formik';
import React, {useEffect, useState} from 'react';
import axios from "axios";
// import {string} from "yup";

function Login(): React.JSX.Element {
  // axios({
  //   method: 'get',
  //   url: `https://10.0.2.2:7268/api/Workspace`,
  // }).then((response) => {
  //   console.log(response.data);
  // });
  // const [isLoading, setIsLoading] = useState(false);
  // const [text, setText] = useState('');
  // useEffect(() => {
  //   const abortController = new AbortController();
  //   const getData = async () => {
  //     console.log('getData');
  //     try {
  //       console.log('try');
  //       setText('try');
  //       setIsLoading(true);
  //       const response = await axios.get('http://10.0.2.2:5263/api/Workspace', {
  //         signal: abortController.signal,
  //       });
  //       console.log('response:', response);
  //       if (response.status === 401) {
  //         console.log("aaaaaaaaaaaaaa");
  //         setText('Unauthorized');
  //         setIsLoading(false);
  //         return;
  //       } else {
  //         setText('Data fetched');
  //         console.log('Data fetched');
  //         setIsLoading(false);
  //         return;
  //       }
  //     } catch (error) {
  //       console.log('catch error');
  //       if (abortController.signal.aborted) {
  //         console.log('Data fetching cancelled');
  //       } else {
  //         console.error('Error fetching data:', error);
  //         setText('Error fetching data');
  //         setIsLoading(false);
  //       }
  //     }
  //   };
  //   getData();
  //   return () => {
  //     abortController.abort();
  //   };
  // }, []);

  useEffect(() => {
    fetch('http://10.0.2.2:5263/api/channel')
        // .then(response => response.json())
        .then(data => console.log('Data:', data))
        .catch(error => console.error('Fetch error:', error));
  }, []);

  return (<Text>{'fetching'}</Text>);

  // retu3rn (
  //   <SafeAreaView style={styles.container}>
  //     <View style={styles.card}>
  //       <Text style={styles.title}>Welcome Back! 👋</Text>
  //       <Text style={styles.subtitle}>Please enter your login informations</Text>
  //
  //       <View style={styles.switchContainer}>
  //         <TouchableOpacity style={[styles.switchButton, styles.activeButton]}>
  //           <Text style={styles.activeText}>Sign In</Text>
  //         </TouchableOpacity>
  //         <TouchableOpacity style={styles.switchButton}>
  //           <Text style={styles.inactiveText}>Sign Up</Text>
  //         </TouchableOpacity>
  //       </View>
  //
  //       <Formik
  //         initialValues={{ email: '', password: '' }}
  //         onSubmit={values => console.log(values)}
  //       >
  //         {({ handleChange, handleBlur, handleSubmit, values }) => (
  //           <>
  //             <Text style={styles.label}>Email</Text>
  //             <TextInput
  //               style={styles.input}
  //               placeholder="Email"
  //               onChangeText={handleChange('email')}
  //               onBlur={handleBlur('email')}
  //               value={values.email}
  //               keyboardType="email-address"
  //             />
  //
  //             <Text style={styles.label}>Password</Text>
  //             <TextInput
  //               style={styles.input}
  //               placeholder="Password"
  //               onChangeText={handleChange('password')}
  //               onBlur={handleBlur('password')}
  //               value={values.password}
  //               secureTextEntry
  //             />
  //
  //             <TouchableOpacity style={styles.button} onPress={() => handleSubmit()}>
  //               <Text style={styles.buttonText}>CONTINUE</Text>
  //             </TouchableOpacity>
  //           </>
  //         )}
  //       </Formik>
  //       <Text style={styles.orText}>Or Connect With</Text>
  //
  //       <View style={styles.socialContainer}>
  //         <TouchableOpacity style={styles.socialButton}>
  //           <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} style={styles.icon} />
  //           <Text>Google</Text>
  //         </TouchableOpacity>
  //         <TouchableOpacity style={styles.socialButton}>
  //           <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png' }} style={styles.icon} />
  //           <Text>Facebook</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   </SafeAreaView>
  // );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    elevation: 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  activeButton: {
    borderBottomColor: '#000',
  },
  activeText: {
    fontWeight: 'bold',
  },
  inactiveText: {
    color: '#888',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#647AFF',
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  orText: {
    color: '#aaa',
    marginVertical: 10,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    width: '48%',
    justifyContent: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
});

export default Login;