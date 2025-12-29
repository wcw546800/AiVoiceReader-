import './global.css';
import * as React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ThemeProvider } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import ReaderScreen from './src/screens/ReaderScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <ThemeProvider>
            <View style={{ flex: 1, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: '100%', maxWidth: 480, height: '100%', backgroundColor: '#fff', overflow: 'hidden' }}>
                    <NavigationContainer>
                        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="Home" component={HomeScreen} />
                            <Stack.Screen name="Reader" component={ReaderScreen} />
                        </Stack.Navigator>
                    </NavigationContainer>
                </View>
            </View>
        </ThemeProvider>
    );
}
