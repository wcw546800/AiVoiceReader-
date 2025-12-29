import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKS_KEY = 'BOOKS_DATA';

export const saveBook = async (book) => {
    try {
        const storedBooks = await getBooks();
        const updatedBooks = [book, ...storedBooks.filter(b => b.id !== book.id)];
        await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));
        return updatedBooks;
    } catch (e) {
        console.error("Failed to save book", e);
        return [];
    }
};

export const getBooks = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(BOOKS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error("Failed to fetch books", e);
        return [];
    }
};

export const updateBookProgress = async (bookId, currentParagraph) => {
    try {
        const storedBooks = await getBooks();
        const updatedBooks = storedBooks.map(b => {
            if (b.id === bookId) {
                return { ...b, lastRead: Date.now(), progress: currentParagraph };
            }
            return b;
        });
        // Sort by last read
        updatedBooks.sort((a, b) => (b.lastRead || 0) - (a.lastRead || 0));
        await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));
        return updatedBooks;
    } catch (e) {
        console.error("Failed to update progress", e);
    }
};

export const removeBook = async (bookId) => {
    try {
        const storedBooks = await getBooks();
        const updatedBooks = storedBooks.filter(b => b.id !== bookId);
        await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));
        return updatedBooks;
    } catch (e) {
        console.error("Failed to remove book", e);
        return [];
    }
}
