async function getBooks() {
    const response = await fetch("http://localhost:8000/api/v1/books")
    const data = await response.json()
    console.log(data);
}

getBooks()