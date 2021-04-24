// creates a variable to hold the db connection
let db;

// establishes a connection to IndexedDB database called 'budget-tracker' and sets it to version 1 
// .open() takes in two parameters: the name of the indexedDB and the version of the database
const request = indexedDB.open('budget-tracker', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
  //save a reference to the database
  const db = event.target.result;
  //create an object store (table) called `new-transaction`, set it to have an auto increminting primary key 
  db.createObjectStore('new_entry', { autoIncrement: true });
};

// upon successful request
request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradneeded event above) or simply established a connection, save reference to db in a global variable
  db = event.target.result;

  // check if app is online, if yes run uploadTransaction() function to send all local db data to api
  if (navigator.online) {
    console.log('I am here!!')
    uploadEntry();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit a new transaction and there's not internet connection
// where do I add this functions .catch? index.js?
function saveRecord(record) {
  // opens a new transaction with the database with read and write permissions
  const transaction = db.transaction(['new_entry'], 'readwrite');

  // access the object store for 'new-entry'
  const entryObjectStore = transaction.objectStore('new_entry');

  // add record to the store with add method
  entryObjectStore.add(record);
}

function uploadEntry() {
  alert('Uploaded Entry')
  // open a transaction on the DB
  const transaction = db.transaction(['new_entry'], 'readwrite');

  // access your object store
  const entryObjectStore = transaction.objectStore('new_entry');

  // get all records from store and set to a variable
  const getAll = entryObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  // console.log(JSON.stringify(getAll.result), "I am here ")
  getAll.onsuccess = function() {
    // if there was data in indexedDB's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST', 
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(serverResponse => {
        if (serverResponse.message) {
          throw new Error(serverResponse);
        }
        // open on more transaction
        const transaction = db.transaction(['new_entry'], 'readwrite');
        //access the new-entry object stroe
        const entryObjectStore = transaction.objectStore('new_entry');
        // clear all items in the store
        entryObjectStore.clear();

        alert('All saved entries have been submitted!');
      })
      .catch(err => {
        console.log(err);
      });
    }
  };
};

//listen for app coming back online
window.addEventListener('online', uploadEntry);
