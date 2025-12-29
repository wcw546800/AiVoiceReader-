/// <reference types="nativewind/types" />
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, FlatList, StatusBar, SafeAreaView } from 'react-native';
import * as Speech from 'expo-speech';
import { updateBookProgress } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { splitContentToLines } from '../utils/parser';

// Components
const MenuButton = ({ title, onPress, active, theme }) => (
    <TouchableOpacity
        onPress={onPress}
        style={{ backgroundColor: active ? theme.highlight : theme.border }}
        className="px-4 py-2 rounded-lg mr-2"
    >
        <Text style={{ color: active ? '#fff' : theme.text }} className="font-bold">{title}</Text>
    </TouchableOpacity>
);

const IconButton = ({ icon, label, onPress, theme }) => (
    <TouchableOpacity onPress={onPress} className="items-center justify-center p-2 flex-1">
        <Text style={{ color: theme.text, fontSize: 24 }}>{icon}</Text>
        <Text style={{ color: theme.secondaryText, fontSize: 10, marginTop: 4 }}>{label}</Text>
    </TouchableOpacity>
);

export default function ReaderScreen({ route, navigation }) {
    const { book } = route.params;
    const { theme, changeTheme, themes } = useTheme();

    // State: Content
    const [chapters, setChapters] = useState(book.chapters || []); // Should be passed pre-parsed or parse here? Assuming pre-parsed for now to save complexity, or parse on load if missed
    const [currentChapterIndex, setCurrentChapterIndex] = useState(book.currentChapterIndex || 0);
    const [lines, setLines] = useState([]);

    // State: Reading
    const [currentLineIndex, setCurrentLineIndex] = useState(book.progress || 0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [fontSize, setFontSize] = useState(20);
    const [lineHeightRatio, setLineHeightRatio] = useState(1.8);

    // State: UI
    const [menuVisible, setMenuVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [tocVisible, setTocVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const scrollViewRef = useRef(null);
    const isPlayingRef = useRef(false);
    const linesRef = useRef([]);

    // --- 1. Init & Sync ---
    useEffect(() => {
        // Build lines from current chapter
        if (chapters && chapters.length > 0) {
            const currentChapter = chapters[currentChapterIndex];
            const parsedLines = splitContentToLines(currentChapter.content);
            setLines(parsedLines);
            linesRef.current = parsedLines;

            // Reset line index if changed chapter (unless restoring)
            // For simplicity, we trust the passed `book` object has correct matching indices initially
        }
    }, [chapters, currentChapterIndex]);

    useEffect(() => {
        if (!book.chapters) {
            // Fallback: if entered without parsing (shouldn't happen with new HomeScreen)
            // But let's handle it gracefully or rely on HomeScreen passing it.
            // For now, assume HomeScreen did the heavy lifting or we do it here?
            // Let's do a quick safety check.
        } else {
            setChapters(book.chapters);
        }
    }, [book]);

    // Cleanup & Save
    useEffect(() => {
        return () => {
            stopReading();
            saveProgress();
        };
    }, []);

    const saveProgress = () => {
        updateBookProgress(book.id, {
            chapterIndex: currentChapterIndex,
            lineIndex: isPlayingRef.current ? currentLineIndex : currentLineIndex
        });
    }

    // --- 2. TTS Logic (Enhanced) ---
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    const speakLine = (index) => {
        if (index >= linesRef.current.length) {
            // Next Chapter?
            if (currentChapterIndex < chapters.length - 1) {
                // Auto next chapter
                stopReading(); // Stop briefly to load
                setCurrentChapterIndex(prev => prev + 1);
                setCurrentLineIndex(0);
                setTimeout(() => startReading(), 500); // Resume
            } else {
                setIsPlaying(false);
            }
            return;
        }

        const text = linesRef.current[index];
        Speech.speak(text, {
            language: 'zh-CN',
            rate: speed,
            onDone: () => {
                if (isPlayingRef.current) {
                    setCurrentLineIndex(prev => {
                        const next = prev + 1;
                        speakLine(next); // Chain
                        return next;
                    });
                }
            },
            onError: () => setIsPlaying(false)
        });
    };

    const startReading = () => {
        setIsPlaying(true);
        Speech.stop();
        speakLine(currentLineIndex);
    };

    const stopReading = () => {
        setIsPlaying(false);
        Speech.stop();
    };

    const togglePlay = () => isPlaying ? stopReading() : startReading();

    // --- 3. UI Interactions ---
    const handleScreenTap = () => {
        setMenuVisible(!menuVisible);
        setSettingsVisible(false); // Close settings if opening menu
    };

    const handleJumpChapter = (index) => {
        stopReading();
        setCurrentChapterIndex(index);
        setCurrentLineIndex(0);
        setTocVisible(false);
        setMenuVisible(false);
    };

    // --- Renders ---

    if (!chapters || chapters.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.highlight} />
                <Text style={{ color: theme.secondaryText, marginTop: 20 }}>正在解析书籍...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar hidden={!menuVisible} barStyle={theme.id === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header (Menu) */}
            {menuVisible && (
                <View style={{ backgroundColor: theme.header, borderBottomColor: theme.border }} className="absolute top-0 left-0 right-0 z-50 p-4 pt-12 border-b flex-row justify-between items-center shadow-sm">
                    <TouchableOpacity onPress={() => { saveProgress(); navigation.goBack(); }}>
                        <Text style={{ color: theme.text }}>← 返回书架</Text>
                    </TouchableOpacity>
                    <Text style={{ color: theme.text }} className="font-bold">{chapters[currentChapterIndex]?.title}</Text>
                    <TouchableOpacity onPress={() => setTocVisible(true)}>
                        <Text style={{ color: theme.highlight }}>目录</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Main Content */}
            <TouchableOpacity activeOpacity={1} onPress={handleScreenTap} style={{ flex: 1 }}>
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 60, paddingBottom: 150 }}
                >
                    <Text style={{ color: theme.secondaryText, marginBottom: 20, textAlign: 'center' }}>
                        {chapters[currentChapterIndex]?.title}
                    </Text>
                    {lines.map((line, idx) => (
                        <Text
                            key={idx}
                            style={{
                                fontSize: fontSize,
                                lineHeight: fontSize * lineHeightRatio,
                                color: idx === currentLineIndex ? theme.highlight : theme.text,
                                fontWeight: idx === currentLineIndex ? 'bold' : 'normal',
                                marginBottom: fontSize * 0.8
                            }}
                        >
                            {line}
                        </Text>
                    ))}
                </ScrollView>
            </TouchableOpacity>

            {/* Footer (Play Controls) - Always visible or only with menu? Only with menu for immersive */}
            {menuVisible && (
                <View style={{ backgroundColor: theme.header, borderTopColor: theme.border }} className="absolute bottom-0 left-0 right-0 z-50 pb-8 pt-4 px-4 border-t shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                    {/* Progress Bar placeholder */}
                    <View className="flex-row justify-between mb-4">
                        <Text style={{ color: theme.secondaryText }}>上一章</Text>
                        <Text style={{ color: theme.secondaryText }}>{(currentChapterIndex / chapters.length * 100).toFixed(1)}%</Text>
                        <Text style={{ color: theme.secondaryText }}>下一章</Text>
                    </View>

                    {/* Main Actions */}
                    <View className="flex-row justify-between items-center mb-4">
                        <IconButton icon="⏮" label="上一段" onPress={() => { stopReading(); setCurrentLineIndex(Math.max(0, currentLineIndex - 1)); }} theme={theme} />
                        <IconButton icon={isPlaying ? "⏸" : "▶️"} label={isPlaying ? "暂停" : "朗读"} onPress={togglePlay} theme={theme} />
                        <IconButton icon="⏭" label="下一段" onPress={() => { stopReading(); setCurrentLineIndex(Math.min(lines.length - 1, currentLineIndex + 1)); }} theme={theme} />
                    </View>

                    <View className="flex-row justify-around border-t pt-4" style={{ borderColor: theme.border }}>
                        <TouchableOpacity onPress={() => setTocVisible(true)}><Text style={{ color: theme.text }}>📖 目录</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => setSettingsVisible(true)}><Text style={{ color: theme.text }}>⚙️ 设置</Text></TouchableOpacity>
                        <TouchableOpacity onPress={togglePlay}><Text style={{ color: theme.text }}>🌙 听书</Text></TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Settings Modal (Bottom Sheet style) */}
            <Modal transparent visible={settingsVisible} animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setSettingsVisible(false)} />
                    <View style={{ backgroundColor: theme.header, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                        <Text style={{ color: theme.text, fontSize: 18, marginBottom: 20, fontWeight: 'bold' }}>阅读设置</Text>

                        {/* Themes */}
                        <Text style={{ color: theme.secondaryText, marginBottom: 10 }}>主题背景</Text>
                        <View className="flex-row mb-6">
                            {Object.values(themes).map(t => (
                                <TouchableOpacity
                                    key={t.id}
                                    onPress={() => changeTheme(t.id)}
                                    style={{ backgroundColor: t.background, borderColor: t.border, borderWidth: 1 }}
                                    className="w-12 h-12 rounded-full mr-4 items-center justify-center"
                                >
                                    {theme.id === t.id && <Text style={{ color: t.highlight }}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Font Size */}
                        <Text style={{ color: theme.secondaryText, marginBottom: 10 }}>字号大小: {fontSize}</Text>
                        <View className="flex-row mb-6 justify-between">
                            <MenuButton title="A-" onPress={() => setFontSize(Math.max(12, fontSize - 2))} theme={theme} />
                            <MenuButton title="A+" onPress={() => setFontSize(Math.min(32, fontSize + 2))} theme={theme} />
                        </View>

                        {/* Speed */}
                        <Text style={{ color: theme.secondaryText, marginBottom: 10 }}>朗读语速: {speed.toFixed(1)}</Text>
                        <View className="flex-row mb-6">
                            {[0.8, 1.0, 1.2, 1.5].map(s => (
                                <MenuButton key={s} title={`${s}x`} onPress={() => setSpeed(s)} active={speed === s} theme={theme} />
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* TOC Modal (Sidebar style) */}
            <Modal visible={tocVisible} animationType="fade" onRequestClose={() => setTocVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={{ padding: 16, borderBottomWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => setTocVisible(false)}><Text style={{ color: theme.text, fontSize: 20, marginRight: 16 }}>←</Text></TouchableOpacity>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>目录 ({chapters.length}章)</Text>
                    </View>
                    <FlatList
                        data={chapters}
                        keyExtractor={(item, index) => index.toString()}
                        initialScrollIndex={Math.max(0, currentChapterIndex - 5)}
                        getItemLayout={(data, index) => ({ length: 50, offset: 50 * index, index })}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                onPress={() => handleJumpChapter(index)}
                                style={{ padding: 16, borderBottomWidth: 1, borderColor: theme.border, backgroundColor: index === currentChapterIndex ? theme.border : 'transparent' }}
                            >
                                <Text style={{ color: index === currentChapterIndex ? theme.highlight : theme.text }}>{item.title}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </SafeAreaView>
            </Modal>

        </SafeAreaView>
    );
}
