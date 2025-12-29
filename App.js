/// <reference types="nativewind/types" />
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import ReaderScreen from './src/screens/ReaderScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <StatusBar style="dark" />
            <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f5f5f4' } }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Reader" component={ReaderScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
