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
myVideoEl.classList.add("my-live-video")
myVideoEl.style.visibility = "hidden"
myVideoEl.muted = true

const myVideoContainer = document.createElement("div")
myVideoContainer.className = "user-live-video-container my-live-video-container"
myVideoContainer.style.backgroundColor = "black"
myVideoContainer.appendChild(myVideoEl)

const myVideoOptsEl = document.createElement("div")
myVideoOptsEl.className = "video-options my-video-options"
myVideoContainer.appendChild(myVideoOptsEl)

const myVideoToggle = document.createElement("button")
myVideoToggle.className = "video-option-btn my-video-toggle-btn"
myVideoToggle.dataset.state = "off"
myVideoOptsEl.appendChild(myVideoToggle)

const videoStateIcon = document.createElement("span")
videoStateIcon.className = "video-state-icon material-symbols-outlined"
videoStateIcon.textContent = "videocam_off"
myVideoToggle.appendChild(videoStateIcon)

const myAudioToggle = document.createElement("button")
myAudioToggle.className = "video-option-btn my-audio-toggle-btn"
myAudioToggle.dataset.state = "off"
myVideoOptsEl.appendChild(myAudioToggle)

const audioStateIcon = document.createElement("span")
audioStateIcon.className = "audio-state-icon material-symbols-outlined"
audioStateIcon.textContent = "mic_off"
myAudioToggle.appendChild(audioStateIcon)

const myVideoStream = await navigator
    .mediaDevices
    .getUserMedia({
        video: true,
        audio: true
    })
    .catch(err =>
        console.log("Failed to get media access", err))


myVideoStream.getVideoTracks()[0].enabled = false
myVideoStream.getAudioTracks()[0].enabled = false

on(myVideoToggle, "click", evt => {
    const dataset = myVideoToggle.dataset
    if (dataset.state === "off") {
        dataset.state = "on"
        myVideoEl.style.visibility = "visible"
        myVideoEl.parentElement.style.backgroundColor = "initial"
        videoStateIcon.textContent = "videocam"
        myVideoStream.getVideoTracks()[0].enabled = true
        return;
    }
    dataset.state = "off"
    myVideoEl.style.visibility = "hidden"
    myVideoEl.parentElement.style.backgroundColor = "black"
    videoStateIcon.textContent = "videocam_off"
    myVideoStream.getVideoTracks()[0].enabled = false
})

on(myAudioToggle, "click", evt => {
    const dataset = myAudioToggle.dataset
    if (dataset.state === "off") {
        dataset.state = "on"
        audioStateIcon.textContent = "mic"
        myVideoStream.getAudioTracks()[0].enabled = true
        return;
    }
    dataset.state = "off"
    audioStateIcon.textContent = "mic_off"
    myVideoStream.getAudioTracks()[0].enabled = false
})

addVideoStream(myVideoEl, myVideoStream)

myPeer.on("call", call => {

    call.answer(myVideoStream)
    const otherVideoEl = document.createElement("video")

    const userVideoContainer = document.createElement("div")
    userVideoContainer.className = "user-live-video-container"
    userVideoContainer.appendChild(otherVideoEl)

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

    const userVideoContainer = document.createElement("div")
    userVideoContainer.className = "user-live-video-container"
    userVideoContainer.appendChild(otherVideoEl)

    call.on("stream", otherVideoStream =>
        addVideoStream(otherVideoEl, otherVideoStream))

    socket.on("user-disconnected", _userId =>
        _userId === userId ? userVideoContainer.remove() : null)

    call.on("close", () => userVideoContainer.remove())
}

function addVideoStream(videoEl, stream) {
    videoEl.srcObject = stream

    on(videoEl, "loadedmetadata", () => videoEl.play())

    videoEl.classList.add("user-live-video")

    videoContainer.appendChild(videoEl.parentElement)
}


