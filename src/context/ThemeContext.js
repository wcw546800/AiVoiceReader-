import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const THEMES = {
    light: {
        id: 'light',
        name: '默认白',
        background: '#fbfbf9', // 纸张白
        text: '#292524',       // 深灰
        secondaryText: '#78716c',
        highlight: '#2563eb',  // 蓝
        header: '#ffffff',
        border: '#e7e5e4',
    },
    sepia: {
        id: 'sepia',
        name: '羊皮纸',
        background: '#f3e9d2', // 暖黄
        text: '#433422',       // 深褐
        secondaryText: '#8a7d70',
        highlight: '#a47e3b',
        header: '#eaddcf',
        border: '#d6c8b5',
    },
    dark: {
        id: 'dark',
        name: '夜间模式',
        background: '#1c1917', // 深黑
        text: '#a8a29e',       // 浅灰
        secondaryText: '#57534e',
        highlight: '#eab308',  // 黄
        header: '#292524',
        border: '#44403c',
    },
    green: {
        id: 'green',
        name: '护眼绿',
        background: '#dcfce7', // 浅绿
        text: '#14532d',       // 深绿
        secondaryText: '#166534',
        highlight: '#15803d',
        header: '#bbf7d0',
        border: '#86efac',
    },
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(THEMES.light);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const storedThemeId = await AsyncStorage.getItem('APP_THEME');
            if (storedThemeId && THEMES[storedThemeId]) {
                setTheme(THEMES[storedThemeId]);
            }
        } catch (e) {
            console.log("Failed to load theme");
        }
    };

    const changeTheme = async (themeId) => {
        if (THEMES[themeId]) {
            setTheme(THEMES[themeId]);
            await AsyncStorage.setItem('APP_THEME', themeId);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, changeTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
