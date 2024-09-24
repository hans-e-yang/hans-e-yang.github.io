---
title: Course Commenting Web App 
publishedDate: 19 April 2024
lastUpdate: 6 September 2024
published: false
description: A basic commenting app 
projectLinks:
  - name: Github
    url: https://github.com/hans-e-yang/Course-Commenting-App

---

## Contents

## Introduction

This series will provide a tutorial on making a full stack web app with 
[ReactJS] for the frontend and [ExpressJS] with [NodeJS] for the backend. 
Finally, we will use [SQLite] for the database. 
The web app we make will be a simple basic commenting app which will roughly 
demonstrate how a full stack web app will generally be structured.
I will assume the reader has some familiarity with Javascript, particularly in
[callbacks], [promises], [the fetch API][Fetch], and 
[declarative/functional array functions][Functional Array]. 
I would recommend some of these videos to get an idea of the tools used,
although they may be quite fast:

- [NodeJS][Fireship NodeJS]
- [ReactJS][Fireship ReactJS]
- [ExpressJS and RESTAPIs][Fireship ExpressJS]
- [SQL][Fireship SQL]

Before starting the project, do make sure that [NodeJS][NodeJS Download] is installed 
and make sure [npm] (Node Package Manager) is available in your system 
(it should come installed with NodeJS).
```bash
# command prompt / terminal
# Check if npm is installed
npm --version
```

## Setting up ReactJS

Let us start by setting up the frontend side. 
In your project root folder, make 2 folders for the frontend and backend.

We will now install ReactJS in the frontend folder. 
To do this, run the following command in the frontend directory.

```bash
# /frontend
npx create-react-app .
npm start
```

Just follow the instructions and then you should see the initial ReactJS Screen.

![ReactJS initial screen](/blogs/course-comment-app/reactScreen.png)

Try reading this if you are having problems: [create-react-app]


## Setting up NodeJS and Ex

Next, we will install ExpressJS for the backend.

```bash
# /backend
npm init
npm install express
```

Read the [Express documentation][ExpressJS Install] for more information.

Afterwards, make a file called `index.js` and write the following code.

```js
// /backend/index.js
const express = require("express")
const app = express()
const port = 3001

app.get("/", (req, res) => {
    res.send("Hello world!")
})

app.listen(port, () => {
    console.log(`Course Commenting Web App BackEnd listening on port ${port}`)
})
```

This is the exact same code as in [Express Hello World].

If you are using git, you may want to consider adding `node_modules` to your
`.gitignore` file.

Now, run Express by typing in `node index.js` in the terminal. If you then search http://localhost:3001 in a web browser, you should get a 'Hello World!' message.

Now try changing the 'Hello World!' message to something else and restart the browser. You should see that observe that the message doesn't change unless 
you restart the server. We can automate this using nodemon.

```bash
# /backend
npm install -g nodemon
npx nodemon index.js
```
Read more: [Nodemon]


## Simple REST API

Right now, we have a single API route in ExpressJS, by sending a GET request to the '/' route, the server will respond with 'Hello World'.

Now we will try to call the API from React. One way to do that is to use the native fetch API provided by browsers. 


```js
// /frontend/src/app.js
function App(){
    fetch("http://localhost:3001")
        .then(async (res) => {
            console.log(await res.text())
        })
        .catch(err => console.error(err))  
    ...
}
```
Read more: [fetch()][Fetch]

This code should send a GET request to the backend server and print the response out into the console.
However, the console may instead print out this error message. 

<code class="language-txt border border-primary" style="padding: 1rem;">
Access to fetch at 'http://localhost:3001/' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
</code>

Watch more: [CORS][Fireship CORS]

CORS is a security policy enforced by the browser. When the server [origin] is different from the client origin (cross origin), it will check the server response if it allows the client site to receive data from the server. If the Access-Control-Allow-Origin header is not present, the browser will by default reject the request.

In fact, this security policy is only enforced by the browser. If you try to request the resource using other methods, such as the python requests library or running curl `http://localhost:3001/` in the terminal, you will still see that the server responds to the request.

Let's now seet the CORS policy in ExpressJS.

```bash
# /backend
npm install cors
```
Read more: [ExpressJS CORS]

```js
// /backend/index.js
...
const cors = require("cors")
...
app.use(cors({origin: "http://localhost:3000"}))
...
```
Add CORS headers

By doing this, every server response will have a header (`Access-Control-Allow-Origin`) that tells the browser that `http://localhost:3000` can access the resource.

If you refresh the React App, you should now see 'Hello world!' in the console. We have successfully enabled communication between the frontend React app and backend Express app. 


## Setting Up the Course List

In this section, we will begin working on the UI with React. I am going to start by making a `CourseList` component. This component will get the course list from the backend, show it to the user, and allow the user to select a course. 

Let us define a `course` as a JS Object with an `id` and `course` property.

```js
{
    id: number,
    course: string
}
```
Structure of `course` object.


```jsx
// /frontend/src/components/CourseList.js
import { useState, useEffect } from 'react'

// onCourseSelected is a Callback Function prop
// Lets the child component call a function from the parent
function CourseList({onCourseSelected}) {
    // Create a state variable containing the list of courses
    // JS destructuring assignment
    const [courses, setCourses] = useState([])

    // UseEffect runs the function in 2 conditions:
    //   - on start (after initial render)
    //   - When any state variable in the 
    //      dependency array changes
    useEffect(()=>{
        // Get course list from backend, then update 'courses' state
        fetch("http://localhost:3001/courseList")
            .then(async (res) => {
                setCourses(await res.json())
            })
    // Empty dependency array means this will only run once
    //  after initial render
    }, [])

    return (
        <div>
            {/*Map objects in the 'courses' state variable into HTML button tags*/}
            {/*When 'courses' changes, the HTML will also react accordingly*/}
            {courses.map(course => (
                <button
                    // On click, runs the function passed by the parent
                    // with course name as the argument
                    onClick={()=>{onCourseSelected(course)}} 
                    key={course.id}>
                    {course.code}
                </button>
            ))}
        </div>
    )
}

export default CourseList
```
Read more: [useState()], [useEffect()], [Fetching data in useEffect()], [Passing props]

The component sends a GET request to `/courseList`. We will now tell Express to respond to it by sending a list of courses.
```js
// /backend/index.js

...
// res.body : Course{id: number, course: string}[]
app.get('/courseList', (req, res)=>{
    // Hard code the returned data for now, 
    // since we don't have a database yet
    res.send([
        {id: 1, code: "CS101"}, 
        {id: 2, code: "MA101"}, 
        {id: 3, code: "PHY101"}
    ])
})
...
```
GET `/courseList`

Finally, we are going to add this component in App.js.

```jsx
// /frontend/src/app.js

import CourseList from './components/CourseList'
import './App.css'

function App() {
    return (
        {/* Pass in a function to the component */}
        <CourseList onCourseSelected={console.log} />
    )
} 
```
<br>

Now, the React app should have 3 buttons and when you click the buttons, the console will print out the selected `course` object. 

![CourseList Component](/blogs/course-comment-app/CourseList.png)
<br>

So we have now allowed the user to select among a list of courses that we have fetched from the backend.

## Setting Up the Reviews

Let's now work on the `Reviews` component. This component will accept a `course` object as a prop. When the `course` object changes, 
the review will fetch reviews on the course and display it. The code should be roughly similar to the `courseList` component.

A `Review` object is defined as such

```ts
{
    id: number,
    rating: number,
    message: string
}
```
<br>

Now for the `Reviews` component.

```js
// /frontend/src/components/Reviews.js

import { useState, useEffect } from "react“

function Reviews({course}) {
    const [reviews, setReviews] = useState([])

    useEffect(() => {
        if (course.code !== "") {
            // We use URL query params to select which course 
            //  we want to get the reviews of. 
            fetch("http://localhost:3001/reviews?courseId="
                    + course.id)
                .then(async res => { 
                    setReviews(await res.json()) 
                })
        }
        // Now we have 'course' as a dependency, so any time 
        //  'course' changes, the function passed 
        //   to 'useEffect' will run again.
    }, [course])  

    return (
        <div>
            <h2>{course.code}</h2>

            {reviews.map(review => (
                <div key={review.id}>
                    <p>Rating: {review.rating}</p>
                    <p>Comment: {review.message}</p>
                    <hr />
                </div>
            ))}
        </div>
    )
}

export default Reviews
```
Read More: [Rendering Lists]

Again, we should now define the API route `/reviews` in `backend/index.js`. 
The API route should read the param, and return reviews based on the course code. 
Since there is no database yet, we will just hard code the reviews.

```js
// /backend/index.js

...
const reviews = [
    {id: 1, courseId: 1, rating: 3, message: "An okay course"},
    {id: 2, courseId: 1, rating: 5, message: "The lectures by Professor A were very interesting"},
    {id: 3, courseId: 2, rating: 1, message: "I got a D grade, too hard"},
    {id: 4, courseId: 2, rating: 3, message: "I got an A, the lectures didn't help too much"},
    {id: 5, courseId: 3, rating: 4, message: "Cons: there was a group assignment, Pros: the students generally work hard :)"}
]
// req.query.courseId : number
// res.body : Review{id: number, rating: number, message: string}[]
app.get("/reviews", (req, res) => {
    // Filter the reviews according to courseCode in the request query params
    res.send(reviews.filter(review => review.courseId == req.query.courseId))
})
...
```
<br>

Now use it in the app.

```js
// /frontend/src/app.js

import CourseList from './components/CourseList'
import Reviews from './components/Reviews'
import { useState } from 'react'

function App() {
    const [selectedCourse, 
        setSelectedCourse] = useState({id: -1, code: ""})
    return (
        {/* A bit of styling */}
        <div style={{padding: "10px"}}>
            {/* Connect the two components 
                using a state variable */}
            <CourseList onCourseSelected={setSelectedCourse} />
            <Reviews course={selectedCourse} />
        </div> 
    );
}
  
export default App;
```
<br>




Now, if you click one of the buttons, you will see a list of reviews for that course.

![List of Reviews for CS101 Course](/blogs/course-comment-app/Reviews.png)


## Adding More Reviews

Finally, we will make an `AddReview` component which will have a form to add a review on the selected course. The component will then send a request to the backend server with the form data to store the review. 

```js
// /frontend/src/components/AddReview.js

function AddReview({course}) {
    // Ajax form submission to not reload page
    function submitForm(event) {
        event.preventDefault()

        // Get data from Form HTML Element and 
        // parse to JS Object
        const formData = new FormData(event.target)
        const data = Object.fromEntries(formData.entries())
        data.courseId = course.id
        fetch("http://localhost:3001/reviews", {
            method: "post",
            // Send JSON file in body
            // Must specify the encoding here
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(res => console.log(res))
    }

    if (course.code !== "") {
        return (
            {/* Note the input tag names */}
            <form onSubmit={submitForm}>
                <p>Add review to {course.code}
                <input type="number" title="rating" name="rating" min="1" max="5" />
                <br/>
                <textarea title="message" name="message" />
                <br />
                <input type="submit" value="Submit" />
            </form>
        )
    }
};

export default AddReview;
```

 In this component, we have a form which when submitted, will send a POST request to `http://localhost:3001/reviews` with the body containing the data as a JS object. In the example, we get data from the Form element by using `new FormData()`, then parse it as JSON. In my opinion, for our purposes, JSON is more convenient. FormData is often used when uploading files whereas JSON is typically used for data like this.

The server needs to access the request body and then store the data. However, there is a slight problem: Express by default doesn't understand json, so with the following code, submitting the form in the `AddReview.js` will result in undefined being printed out.
We can solve this by telling Express to use thee JSON [middleware].
```js
// /backend/index.js

...
// Note: we now use app.post to handle POST requests
app.post("/reviews", (req, res) => {
    console.log(req.body)
    res.sendStatus(200)
})
...
```
<br>
Again, we add tge componeent into app.js

```js
...
import AddReview from './components/AddReview.js'
...
function App() {
    ...
    return (
        ...
        <AddReview course={selectedCourse} />
    )
}
...
```
<br>

Now we tell Express how to handle the POST request.

```js
// /backend/index.js

...
const reviews = [
    {id: 1, courseId: 1, rating: 3, message: "An okay course"},
    {id: 2, courseId: 1, rating: 5, message: "The lectures by Professor A were very interesting"},
    {id: 3, courseId: 2, rating: 1, message: "I got a D grade, too hard"},
    {id: 4, courseId: 2, rating: 3, message: "I got an A, the lectures didn't help too much"},
    {id: 5, courseId: 3, rating: 4, message: "Cons: there was a group assignment, Pros: the students generally work hard :)"}
]
...

// req.body : {
//      courseId: number, 
//      rating: number, 
//      message: string
//  }
app.post("/reviews", (req, res) => {
    // Since we don't have a database yet, just save the responses into memory
    reviews.push({
        id: reviews.length+1,
        courseId: req.body.courseId,
        rating: req.body.rating,
        message: req.body.string
    })
    // Tells the client that request is processed ok
    res.sendStatus(200)
})
...
```

Now, when you fill in a review and refresh the page, you should see your review saved.

However, the data isn't persistent. It only lasts while the server is on, since it is 
stored in memory. 


## Adding in SQLite

We will use sqlite


[ReactJS]: https://react.dev/
[ExpressJS]: https://expressjs.com/
[NodeJS]: https://nodejs.org
[SQLite]: https://www.sqlite.org/
[Callbacks]: https://www.w3schools.com/js/js_callback.asp
[Promises]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[Fetch]: https://www.freecodecamp.org/news/how-to-use-fetch-api/
[Functional Array]: https://medium.com/clearscore/javascript-functional-imperative-map-filter-reduce-aedf0e48dece
[Fireship NodeJS]: https://www.youtube.com/watch?v=ENrzD9HAZK4
[Fireship ReactJS]: https://www.youtube.com/watch?v=Tn6-PIqc4UM
[Fireship ExpressJS]: https://www.youtube.com/watch?v=-MTSQjw5DrM
[Fireship SQL]: https://www.youtube.com/watch?v=zsjvFFKOm3c
[Fireship CORS]: https://www.youtube.com/watch?v=4KHiSt0oLJ0
[NodeJS Download]: https://nodejs.org/en/download
[NPM]: https://www.npmjs.com/
[create-react-app]: https://create-react-app.dev/docs/getting-started
[ExpressJS Install]: https://expressjs.com/en/starter/installing.html
[Express Hello World]: https://expressjs.com/en/starter/hello-world.html
[Nodemon]: https://www.npmjs.com/package/nodemon
[Origin]: https://developer.mozilla.org/en-US/docs/Glossary/Origin
[ExpressJS CORS]: https://expressjs.com/en/resources/middleware/cors.html
[useState()]: https://react.dev/reference/react/useState
[useEffect()]: https://react.dev/learn/synchronizing-with-effects#fetching-data
[Fetching data in useEffect()]: https://www.robinwieruch.de/react-hooks-fetch-data/
[Passing props]: https://react.dev/learn/passing-props-to-a-component
[Rendering Lists]: https://react.dev/learn/rendering-lists
[Middleware]: https://expressjs.com/en/guide/using-middleware.html
