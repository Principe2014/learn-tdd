import Author from '../models/author';
import { getAuthorList } from '../pages/authors'; 
import { Response } from 'express';
import { showAllAuthors } from '../pages/authors';

describe('getAuthorList', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should fetch and format the authors list correctly', async () => {
        // Define the sorted authors list as we expect it to be returned by the database
        const sortedAuthors = [
            {
                first_name: 'Jane',
                family_name: 'Austen',
                date_of_birth: new Date('1775-12-16'),
                date_of_death: new Date('1817-07-18')
            },
            {
                first_name: 'Amitav',
                family_name: 'Ghosh',
                date_of_birth: new Date('1835-11-30'),
                date_of_death: new Date('1910-04-21')
            },
            {
                first_name: 'Rabindranath',
                family_name: 'Tagore',
                date_of_birth: new Date('1812-02-07'),
                date_of_death: new Date('1870-06-09')
            }
        ];

        // Mock the find method to chain with sort
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(sortedAuthors)
        });

        // Apply the mock directly to the Author model's `find` function
        Author.find = mockFind;

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Check if the result matches the expected sorted output
        const expectedAuthors = [
            'Austen, Jane : 1775 - 1817',
            'Ghosh, Amitav : 1835 - 1910',
            'Tagore, Rabindranath : 1812 - 1870'
        ];
        expect(result).toEqual(expectedAuthors);

        // Verify that `.sort()` was called with the correct parameters
        expect(mockFind().sort).toHaveBeenCalledWith([['family_name', 'ascending']]);

    });

    it('should format fullname as empty string if first name is absent', async () => {
        // Define the sorted authors list as we expect it to be returned by the database
        const sortedAuthors = [
            {
                first_name: '',
                family_name: 'Austen',
                date_of_birth: new Date('1775-12-16'),
                date_of_death: new Date('1817-07-18')
            },
            {
                first_name: 'Amitav',
                family_name: 'Ghosh',
                date_of_birth: new Date('1835-11-30'),
                date_of_death: new Date('1910-04-21')
            },
            {
                first_name: 'Rabindranath',
                family_name: 'Tagore',
                date_of_birth: new Date('1812-02-07'),
                date_of_death: new Date('1870-06-09')
            }
        ];

        // Mock the find method to chain with sort
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(sortedAuthors)
        });

        // Apply the mock directly to the Author model's `find` function
        Author.find = mockFind;

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Check if the result matches the expected sorted output
        const expectedAuthors = [
            ' : 1775 - 1817',
            'Ghosh, Amitav : 1835 - 1910',
            'Tagore, Rabindranath : 1812 - 1870'
        ];
        expect(result).toEqual(expectedAuthors);

        // Verify that `.sort()` was called with the correct parameters
        expect(mockFind().sort).toHaveBeenCalledWith([['family_name', 'ascending']]);

    });

    it('should return an empty array when an error occurs', async () => {
        // Arrange: Mock the Author.find() method to throw an error
        Author.find = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Verify the result is an empty array
        expect(result).toEqual([]);
    });
});


describe('showAllAuthors', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should send a list of authors when data is available', async () => {
        const mockAuthors = [
          {
            first_name: 'Adam',
            family_name: 'Mickiewicz',
            date_of_birth: new Date('1798-12-24'),
            date_of_death: new Date('1855-11-26'),
          },
          {
            first_name: 'Henryk',
            family_name: 'Sienkiewicz',
            date_of_birth: new Date('1846-05-05'),
            date_of_death: new Date('1916-11-15'),
          },
        ];
    
        
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockAuthors)
        });

        Author.find = mockFind;

        const mockRes = {
            send: jest.fn()
        } as unknown as Response;

        await showAllAuthors(mockRes);

        expect(mockRes.send).toHaveBeenCalledWith([
            'Mickiewicz, Adam: 1798 - 1855',
            'Sienkiewicz, Henryk: 1846 - 1916',
          ]);   
    });

    it('should send "No authors found" when no authors are available', async () => {
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        Author.find = mockFind;

        const mockRes = {
            send: jest.fn()
        } as unknown as Response;

        await showAllAuthors(mockRes);

        expect(mockRes.send).toHaveBeenCalledWith('No authors found');
    });

    it('should handle errors and sends "No authors found" when an error occurs', async () => {
        Author.find = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });

        const mockRes = {
            send: jest.fn()
        } as unknown as Response;

        await showAllAuthors(mockRes);

        expect(mockRes.send).toHaveBeenCalledWith('No authors found');
    });

    it('should handle deformed response objects', async () => {
        const mockRes = {
            send: jest.fn().mockImplementationOnce(() => {
                throw new Error('Response error');
            }),
        } as unknown as Response;
    
        await showAllAuthors(mockRes)
        
        expect(mockRes.send).toHaveBeenCalledWith('No authors found');
    });
});
