/// <reference types="nativewind/types" />
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import { saveBook, getBooks, removeBook } from '../utils/storage';

export default function HomeScreen({ navigation }) {
    const [books, setBooks] = useState([]);

    const loadBooks = async () => {
        const data = await getBooks();
        setBooks(data);
    };

    useFocusEffect(
        useCallback(() => {
            loadBooks();
        }, [])
    );

    const handleAddBook = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/plain'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const content = await FileSystem.readAsStringAsync(file.uri);

            // Basic validation
            if (content.length < 50) {
                Alert.alert("Failed", "文件太短或内容为空");
                return;
            }

            const newBook = {
                id: Date.now().toString(),
                title: file.name.replace('.txt', ''),
                uri: file.uri,
                preview: content.substring(0, 100).replace(/\n/g, ' '),
                content: content, // Note: storing full content in async storage is not ideal for huge files, but OK for MVP text files
                progress: 0,
                addedAt: Date.now(),
                lastRead: Date.now()
            };

            await saveBook(newBook);
            loadBooks();
            navigation.navigate('Reader', { book: newBook });

        } catch (e) {
            Alert.alert("Error", "无法导入书籍: " + e.message);
        }
    };

    const deleteBook = (id) => {
        Alert.alert("删除", "确定要删除这本书吗？", [
            { text: "取消", style: "cancel" },
            {
                text: "删除", style: "destructive", onPress: async () => {
                    await removeBook(id);
                    loadBooks();
                }
            }
        ])
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity
            className="bg-white p-4 mb-3 rounded-xl shadow-sm border border-stone-100 flex-row items-center"
            onPress={() => navigation.navigate('Reader', { book: item })}
            onLongPress={() => deleteBook(item.id)}
        >
            <View className="w-12 h-16 bg-blue-100 rounded-md items-center justify-center mr-4">
                <Text className="text-2xl">📖</Text>
            </View>
            <View className="flex-1">
                <Text className="text-lg font-bold text-stone-800" numberOfLines={1}>{item.title}</Text>
                <Text className="text-stone-400 text-xs mt-1" numberOfLines={2}>{item.preview}...</Text>
                {item.progress > 0 && (
                    <Text className="text-blue-500 text-xs mt-2">看到第 {item.progress + 1} 段</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#f5f5f4] px-4">
            <View className="py-4 flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-stone-800">我的书架</Text>
                <TouchableOpacity onPress={handleAddBook} className="bg-stone-800 px-4 py-2 rounded-full">
                    <Text className="text-white font-bold">+ 导入</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={books}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Text className="text-stone-400 text-base">书架是空的</Text>
                        <Text className="text-stone-300 text-sm mt-2">点击右上角导入 TXT 小说</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
