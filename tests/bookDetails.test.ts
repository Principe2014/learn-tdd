import { Response } from 'express';
import Book from '../models/book'; // Adjust the import to your Book model path
import BookInstance from '../models/bookinstance'; // Adjust the import to your BookInstance model path
import { showBookDtls } from '../pages/book_details'; // Adjust the import to where showBookDtls is defined

describe('showBookDtls', () => {
    let res: Partial<Response>;
    const mockBook = {
        title: 'Mock Book Title',
        author: { name: 'Mock Author' }
    };
    const mockCopies = [
        { imprint: 'First Edition', status: 'Available' },
        { imprint: 'Second Edition', status: 'Checked Out' }
    ];

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(), // Chaining for status
            send: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test
    });

    it('should return book details when the book and copies exist', async () => {
        // Mocking the Book model's findOne and populate methods
        const mockFindOne = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(), // Allows method chaining
            exec: jest.fn().mockResolvedValue(mockBook) // Resolves to your mock book
        });
        Book.findOne = mockFindOne;

        // Mocking the BookInstance model's find and select methods
        const mockFind = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(), // Select is called here
            exec: jest.fn().mockResolvedValue(mockCopies)
        });
        BookInstance.find = mockFind;

        // Act
        await showBookDtls(res as Response, '12345');

        // Assert
        expect(mockFindOne).toHaveBeenCalledWith({ _id: '12345' });
        expect(mockFindOne().populate).toHaveBeenCalledWith('author');
        expect(mockFind).toHaveBeenCalledWith({ book: '12345' });
        expect(mockFind().select).toHaveBeenCalledWith('imprint status');

        expect(res.send).toHaveBeenCalledWith({
            title: mockBook.title,
            author: mockBook.author.name,
            copies: mockCopies
        });
    });

    it('should return 404 if the book instance is null', async () => {
        const id = '12345';
        // Mocking the Book model's findOne method to throw an error
        BookInstance.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(), // Select is called here
            exec: jest.fn().mockResolvedValue(null)
        });

        // Act
        await showBookDtls(res as Response, id);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(`Book details not found for book ${id}`);
    });

    it('should return 500 if there is an error fetching the book', async () => {
        // Mocking the Book model's findOne method to throw an error
        Book.findOne = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });

        // Act
        await showBookDtls(res as Response, '12345');

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Error fetching book 12345');
    });

    it('should return 500 if there is an error fetching book instance', async () => {
        // Mocking the Book model's findOne method to throw an error
        BookInstance.find = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });

        // Act
        await showBookDtls(res as Response, '12345');

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Error fetching book 12345');
    });

    it('should return 404 if book is null', async () => {
        const id = '12345';
        // Mocking the Book model's findOne and populate methods
        const mockFindOne = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(), // Allows method chaining
            exec: jest.fn().mockResolvedValue(null) // Resolves to your mock book
        });
        Book.findOne = mockFindOne;
        // Mocking the BookInstance model's find and select methods
        const mockFind = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(), // Select is called here
            exec: jest.fn().mockResolvedValue(mockCopies)
        });
        BookInstance.find = mockFind;
        // Act
        await showBookDtls(res as Response, id);
        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(`Book ${id} not found`);
    });

    it('should return 404 if book id is non-string', async () => {
        const id = { id: "12345" };
        await showBookDtls(res as Response, id as any as string);
        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(`Book ${id} not found`);
    });

    it('should return 404 if no book instances (copies) are found', async () => {
        const id = '12345';
        BookInstance.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([])
        });
    
        await showBookDtls(res as Response, id);
    
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(`Book ${id} not found`);
    });

    it('should handle book exists but no copies are found', async () => {
        const id = '12345';
        const book = { title: 'Book Title', author: { name: 'Author Name' } };
        Book.findOne = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(book)
        });
    
        BookInstance.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([])
        });
    
        await showBookDtls(res as Response, id);
    
        expect(res.send).toHaveBeenCalledWith({
            title: book.title,
            author: book.author.name,
            copies: []
        });
    });

    it('should handle missing book title or author name', async () => {
        const incompleteBook = { title: null, author: { name: null } };
        Book.findOne = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(incompleteBook)
        });
        BookInstance.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockCopies)
        });
    
        await showBookDtls(res as Response, '12345');
    
        expect(res.send).toHaveBeenCalledWith({
            title: incompleteBook.title,
            author: incompleteBook.author.name,
            copies: mockCopies
        });
    });
    it('should handle an empty book instance array', async () => {
        const id = '12345';
        BookInstance.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([])
        });
    
        await showBookDtls(res as Response, id);
    
        expect(res.send).toHaveBeenCalledWith({
            title: null,
            author: null,
            copies: []
        });
    });

    it('should return 500 if there is a database error fetching book instance', async () => {
        const id = '12345';
        BookInstance.find = jest.fn().mockImplementation(() => {
            throw new Error('Database error fetching book instance');
        });
    
        await showBookDtls(res as Response, id);
    
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(`Error fetching book ${id}`);
    });
    it('should return multiple copies for a book', async () => {
        const mockCopies = [
            { imprint: 'First Edition', status: 'Available' },
            { imprint: 'Second Edition', status: 'Checked Out' },
            { imprint: 'Third Edition', status: 'Available' }
        ];
        const book = { title: 'Mock Book Title', author: { name: 'Mock Author' } };
        
        Book.findOne = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(book)
        });
    
        BookInstance.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockCopies)
        });
    
        await showBookDtls(res as Response, '12345');
    
        expect(res.send).toHaveBeenCalledWith({
            title: book.title,
            author: book.author.name,
            copies: mockCopies
        });
    });
});

