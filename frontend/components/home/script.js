import "/socket.io/socket.io.js"
import "https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.4.6/peerjs.min.js"

import { el, els, on, store } from "/global/global.utility.js"

const socket = io()
const myPeer = new Peer()
const user = store.get("user")

const messageForm = el("form.message-form")
const messageField = el("input.message-field")
const chatListing = el("ul.chat-listing")
const videoContainer = el(".video-container")

const roomIdFetch = await fetch("/generateRoomId")
const roomId = await roomIdFetch.text()

on(messageForm, "submit", function (evt) {
    evt.preventDefault()
    if (messageField.value) {
        socket.emit("chat-message", { user, message: messageField.value })
        messageForm.reset()
    }
})

socket.on("chat-message", function (msgData) {
    const messageItem = document.createElement("li")
    messageItem.className = "chat-message"

    const usernameEl = document.createElement("b")
    usernameEl.className = "user-name"
    usernameEl.textContent = msgData.user.name || "Guest"
    if (user?.name === msgData.user.name) {
        usernameEl.textContent = "You"
        usernameEl.classList.add("user-self-message")
    }
    messageItem.appendChild(usernameEl)

    const messageEl = document.createElement("p")
    messageEl.className = "message"
    messageEl.textContent = msgData.message
    messageItem.appendChild(messageEl)

    chatListing.appendChild(messageItem)
    chatListing.scrollTop = chatListing.scrollHeight

})

const myVideoEl = document.createElement("video")
myVideoEl.muted = true

const myVideoStream = await navigator
    .mediaDevices
    .getUserMedia({
        video: true,
        audio: true
    })
    .catch(err =>
        console.log("Failed to get media access", err))

addVideoStream(myVideoEl, myVideoStream)

myPeer.on("call", call => {

    call.answer(myVideoStream)
    const otherVideoEl = document.createElement("video")

    call.on("stream", otherVideoStream =>
        addVideoStream(otherVideoEl, otherVideoStream))

})

socket.on("user-connected", userId =>
    connectToNewUser(userId, myVideoStream))

myPeer.on("open", id =>
    socket.emit("join-room", roomId, id))

function connectToNewUser(userId, stream) {

    const call = myPeer.call(userId, stream)
    const otherVideoEl = document.createElement("video")

    call.on("stream", otherVideoStream =>
        addVideoStream(otherVideoEl, otherVideoStream))

    socket.on("user-disconnected", _userId =>
        _userId === userId ? otherVideoEl.remove() : null)

    call.on("close", () => otherVideoEl.remove())
}

function addVideoStream(videoEl, stream) {
    videoEl.srcObject = stream

    on(videoEl, "loadedmetadata", () => videoEl.play())

    videoEl.className = "user-live-video"
    videoContainer.append(videoEl)
}


