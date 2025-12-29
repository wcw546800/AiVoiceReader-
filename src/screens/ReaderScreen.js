/// <reference types="nativewind/types" />
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, Slider } from 'react-native'; // Slider might need extra package, using simplified buttons for MVP settings
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { updateBookProgress } from '../utils/storage';

const ControlButton = ({ onPress, title, active = false, color = "bg-stone-100" }) => (
    <TouchableOpacity onPress={onPress} className={`${active ? 'bg-blue-600' : color} p-3 rounded-lg flex-1 mx-1 items-center`}>
        <Text className={`${active ? 'text-white' : 'text-stone-800'} font-bold`}>{title}</Text>
    </TouchableOpacity>
);

export default function ReaderScreen({ route, navigation }) {
    const { book } = route.params;
    const [lines, setLines] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(book.progress || 0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [speed, setSpeed] = useState(0.9);
    const [fontSize, setFontSize] = useState(18);

    const scrollViewRef = useRef(null);
    const isPlayingRef = useRef(false);
    const linesRef = useRef([]);

    // Initialize content
    useEffect(() => {
        if (book.content) {
            const parsed = book.content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            setLines(parsed);
            linesRef.current = parsed;
        }
    }, [book]);

    // Cleanup on exit
    useEffect(() => {
        return () => {
            stopReading();
            updateBookProgress(book.id, isPlayingRef.current ? currentIndex : currentIndex); // Save almost latest
        };
    }, []);

    // Sync ref
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // Auto Play handling
    const speakParagraph = (index) => {
        if (index >= linesRef.current.length || index < 0) {
            setIsPlaying(false);
            return;
        }

        const text = linesRef.current[index];
        Speech.speak(text, {
            language: 'zh-CN',
            rate: speed,
            pitch: 1.0,
            onDone: () => {
                if (isPlayingRef.current) {
                    setCurrentIndex(prev => {
                        const next = prev + 1;
                        if (next < linesRef.current.length) {
                            speakParagraph(next);
                            return next;
                        } else {
                            setIsPlaying(false);
                            return prev;
                        }
                    });
                }
            },
            onStopped: () => {
                // Handled manually
            },
            onError: (e) => {
                console.log("Speech Error", e);
                setIsPlaying(false);
            }
        });
    };

    const startReading = () => {
        setIsPlaying(true);
        Speech.stop();
        speakParagraph(currentIndex);
    };

    const stopReading = () => {
        setIsPlaying(false);
        Speech.stop();
        updateBookProgress(book.id, currentIndex);
    };

    const togglePlay = () => {
        if (isPlaying) stopReading();
        else startReading();
    };

    const changeIndex = (delta) => {
        stopReading();
        setCurrentIndex(prev => {
            const next = Math.max(0, Math.min(lines.length - 1, prev + delta));
            return next;
        });
    };

    // Auto scroll to active paragraph
    useEffect(() => {
        // Simple approximation for scrolling. Precise measurement requires onLayout.
        // For MVP, we won't auto-scroll aggressively to avoid jumping while user reads manually.
        // Ideally we would add a "Focus" button
    }, [currentIndex]);


    return (
        <SafeAreaView className="flex-1 bg-[#fbfbf9]" edges={['bottom']}>
            {/* Header */}
            <View className="px-4 py-3 bg-white border-b border-stone-200 flex-row justify-between items-center shadow-sm z-10">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
                    <Text className="text-stone-500 text-lg">← 返回</Text>
                </TouchableOpacity>
                <Text className="font-bold text-stone-800 max-w-[60%]" numberOfLines={1}>{book.title}</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(true)} className="p-2">
                    <Text className="text-stone-500 text-lg">设置</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-5"
                contentContainerStyle={{ paddingVertical: 20, paddingBottom: 100 }}
            >
                {lines.map((line, idx) => (
                    <TouchableOpacity key={idx} onPress={() => { stopReading(); setCurrentIndex(idx); }}>
                        <Text style={{ fontSize: fontSize, lineHeight: fontSize * 1.6 }} className={`mb-4 text-justify ${idx === currentIndex ? 'text-stone-900 font-bold' : 'text-stone-500'}`}>
                            {idx === currentIndex && <Text className="text-blue-500">▶ </Text>}
                            {line}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Bottom Controls */}
            <View className="absolute bottom-0 w-full bg-white border-t border-stone-200 p-4 pb-8 shadow-lg flex-row items-center justify-between">
                <ControlButton title="上一句" onPress={() => changeIndex(-1)} />
                <ControlButton title={isPlaying ? "⏸ 暂停" : "▶ 播放"} onPress={togglePlay} active={isPlaying} color={isPlaying ? "bg-orange-100" : "bg-blue-100"} />
                <ControlButton title="下一句" onPress={() => changeIndex(1)} />
            </View>

            {/* Settings Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={settingsVisible}
                onRequestClose={() => setSettingsVisible(false)}
            >
                <View className="flex-1 justify-end">
                    <TouchableOpacity className="flex-1 bg-black/30" onPress={() => setSettingsVisible(false)} />
                    <View className="bg-white p-6 rounded-t-3xl shadow-xl">
                        <Text className="text-xl font-bold mb-6 text-center text-stone-800">阅读设置</Text>

                        <View className="mb-6">
                            <Text className="mb-3 text-stone-600 font-medium">语速: {speed.toFixed(1)}x</Text>
                            <View className="flex-row">
                                <ControlButton title="0.8x" onPress={() => setSpeed(0.8)} active={speed === 0.8} />
                                <ControlButton title="1.0x" onPress={() => setSpeed(1.0)} active={speed === 1.0} />
                                <ControlButton title="1.2x" onPress={() => setSpeed(1.2)} active={speed === 1.2} />
                                <ControlButton title="1.5x" onPress={() => setSpeed(1.5)} active={speed === 1.5} />
                            </View>
                        </View>

                        <View className="mb-8">
                            <Text className="mb-3 text-stone-600 font-medium">字号: {fontSize}</Text>
                            <View className="flex-row">
                                <ControlButton title="小" onPress={() => setFontSize(16)} active={fontSize === 16} />
                                <ControlButton title="中" onPress={() => setFontSize(18)} active={fontSize === 18} />
                                <ControlButton title="大" onPress={() => setFontSize(20)} active={fontSize === 20} />
                                <ControlButton title="特大" onPress={() => setFontSize(24)} active={fontSize === 24} />
                            </View>
                        </View>

                        <TouchableOpacity onPress={() => setSettingsVisible(false)} className="bg-stone-900 p-4 rounded-xl">
                            <Text className="text-white text-center font-bold">完成</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
