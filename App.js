/// <reference types="nativewind/types" />
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';

// 简单的 UI 组件
const Button = ({ onPress, title, color = "bg-blue-500", textColor = "text-white" }) => (
    <TouchableOpacity onPress={onPress} className={`${color} p-3 rounded-xl active:opacity-80 mx-1 shadow-sm items-center justify-center min-w-[60px]`}>
        <Text className={`${textColor} font-bold text-center text-base`}>{title}</Text>
    </TouchableOpacity>
);

export default function App() {
    const [bookTitle, setBookTitle] = useState("AI Voice Reader");
    const [paragraphs, setParagraphs] = useState(["欢迎使用 AI 语音朗读。", "请点击下方的 '导入' 按钮开始阅读。", "本项目已开源，支持本地TXT文件导入。"]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const scrollViewRef = useRef(null);
    const isPlayingRef = useRef(false);

    useEffect(() => {
        // 每次 isPlaying 变化时同步 Ref
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/plain'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setBookTitle(file.name.replace('.txt', ''));

            const content = await FileSystem.readAsStringAsync(file.uri);
            // 简单的按换行符分割，并过滤掉太短的行
            const lines = content.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (lines.length === 0) {
                Alert.alert("错误", "文件内容为空或格式不正确");
                return;
            }

            setParagraphs(lines);
            setCurrentIndex(0);
            stopReading();
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "无法读取文件: " + err.message);
        }
    };

    const startReading = () => {
        setIsPlaying(true);
        Speech.stop(); // 停止之前的
        speakAndChain(currentIndex);
    };

    const speakAndChain = (index) => {
        // 检查最新的播放状态
        if (!isPlayingRef.current) return;
        if (index >= paragraphs.length) {
            setIsPlaying(false);
            return;
        }

        const text = paragraphs[index];

        Speech.speak(text, {
            language: 'zh-CN',
            pitch: 1.0,
            rate: 0.9,
            onDone: () => {
                // 注意：onDone 回调可能在播放状态改变后触发
                if (isPlayingRef.current) {
                    // 移动到下一段
                    setCurrentIndex(prev => {
                        const next = prev + 1;
                        // 继续播放下一段
                        // 使用 setTimeout 防止调用栈溢出或太快
                        setTimeout(() => speakAndChain(next), 100);
                        return next;
                    });
                }
            },
            onStopped: () => {
                // 只有被显式停止时才会触发，但我们在 startReading 里调用了 stop() 也会触发
                // 所以这里的逻辑要小心
            },
            onError: (e) => {
                console.log("Speech Error", e);
                setIsPlaying(false);
            }
        });
    };

    const stopReading = () => {
        setIsPlaying(false);
        Speech.stop();
    };

    const togglePlay = () => {
        if (isPlaying) {
            stopReading();
        } else {
            startReading();
        }
    };

    const skipForward = () => {
        stopReading();
        setCurrentIndex(prev => Math.min(prev + 1, paragraphs.length - 1));
    };

    const skipBackward = () => {
        stopReading();
        setCurrentIndex(prev => Math.max(prev - 1, 0));
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f5f5f4]" style={{ paddingTop: Platform.OS === 'android' ? 30 : 0 }}>
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-5 py-4 bg-white shadow-sm z-10 border-b border-stone-200">
                <Text className="text-xl font-bold text-stone-800" numberOfLines={1}>{bookTitle}</Text>
                <Text className="text-xs text-stone-500 mt-1">进度: {currentIndex + 1} / {paragraphs.length}</Text>
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1 px-4"
                ref={scrollViewRef}
                contentContainerStyle={{ paddingVertical: 20, paddingBottom: 150 }}
            >
                {paragraphs.map((p, idx) => (
                    <TouchableOpacity key={idx} onPress={() => { stopReading(); setCurrentIndex(idx); }}>
                        <Text className={`text-lg mb-6 leading-8 tracking-wide ${idx === currentIndex ? 'text-blue-700 font-bold bg-blue-100/50 p-2 rounded-lg' : 'text-stone-700'}`}>
                            {p}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Controls */}
            <View className="absolute bottom-0 w-full bg-white/95 backdrop-blur border-t border-stone-200 p-4 pb-8 flex-row justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <Button title="导入TXT" onPress={pickFile} color="bg-stone-800" />

                <View className="flex-row">
                    <Button title="上段" onPress={skipBackward} color="bg-stone-100" textColor="text-stone-800" />
                    <Button title={isPlaying ? "暂停" : "播放"} onPress={togglePlay} color={isPlaying ? "bg-orange-500" : "bg-blue-600"} />
                    <Button title="下段" onPress={skipForward} color="bg-stone-100" textColor="text-stone-800" />
                </View>
            </View>
        </SafeAreaView>
    );
}
