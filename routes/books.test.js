process.env.NODE_ENV = "test";

const app = require("../app");
const db = require("../db");
const request = require("supertest");
const { response } = require("../app");

let testBook;

beforeEach(async () => {
  const addedBook = await db.query(
    `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) VALUES ('753854367', 'https://amazon.com/books/cyrus', 'Test Author', 'English', '545', 'Knopff House', 'Cyrus The Great', '1997') RETURNING isbn, author, language, author, language, pages, publisher, title, year`
  );
  testBook = addedBook.rows[0];
});

afterEach(async () => {
  await db.query("DELETE FROM books");
});

afterAll(async () => {
  await db.end();
});

describe("Book routes", () => {
  test("GET /books", async () => {
    const res = await request(app).get("/books");
    expect(res.statusCode).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0]).toHaveProperty("language");
    expect(res.body.books[0].author).toBe("Test Author");
  });

  test("GET /books/:isbn", async () => {
    const res = await request(app).get(`/books/${testBook.isbn}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.book).toHaveProperty("isbn");
    expect(res.body.book.title).toBe(testBook.title);
  });

  test("GET /books/:isbn invalid", async () => {
    const res = await request(app).get("/books/4738473");
    expect(res.statusCode).toBe(404);
  });

  test("POST /books", async () => {
    const bookToPost = {
      isbn: "5544778",
      amazon_url: "https://amazon.com/lorelei",
      author: "Cocteau Twin",
      language: "Icelandic",
      pages: 329,
      publisher: "Penguin Random House",
      title: "Lorelei's Ghost",
      year: 1985,
    };
    const res = await request(app).post("/books").send(bookToPost);
    expect(res.statusCode).toBe(201);
    expect(res.body.book.author).toBe(bookToPost.author);
    expect(res.body.book.publisher).toBe(bookToPost.publisher);
  });

  test("POST /books invalid", async () => {
    const bookToPost = {
      isbn: "57348574",
      country: "Finland",
      author: "Pete Hamp",
      subtitle: "An amazing novel!",
    };
    const res = await request(app).post("/books").send(bookToPost);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("PUT /books/:isbn", async () => {
    const update = {
      author: "Tye Hogan",
      language: "Welsh",
      pages: 403,
      publisher: "Sky Publishing",
      title: "Mongo",
      year: 2005,
    };
    const res = await request(app).put(`/books/${testBook.isbn}`).send(update);
    expect(res.statusCode).toBe(200);
    expect(res.body.book).toHaveProperty("isbn");
    expect(res.body.book.isbn).toBe(testBook.isbn);
    expect(res.body.book.title).toBe(update.title);
  });

  test("DELETE /books/:isbn", async () => {
    const res = await request(app).delete(`/books/${testBook.isbn}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toEqual("Book deleted");
  });
});
