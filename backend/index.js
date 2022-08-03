import express from "express"
import Joi from "joi"
import path from "path"
import { fileURLToPath } from "url"
import { createServer } from "http"
import { dbConnect } from "./db.connect.js"
import { Server } from "socket.io"

const __filename = fileURLToPath(import.meta.url),
    __dirname = path.dirname(__filename),
    port = process.env.PORT || 3000

const app = express(),
    server = createServer(app),
    io = new Server(server),
    db = await dbConnect()

const schema = Joi.object({
    username: Joi.string()
        .alphanum()
        .required()
        .min(3)
        .max(30),
    password: Joi.string()
        .required()
        .min(6)
        .max(20)
        .custom((value, helper) => {
            const isValid = value.includes(/[0-9]/) &&
                value.includes(/\s/) &&
                value.includes(/[a-z]/) &&
                value.includes(/[A-Z]/) &&
                value.includes(/[^a-zA-Z\d\s]/)
            isValid ? value : helper.error("string.invalid")
        }),
    age: Joi.number()
        .integer()
        .min(18)
        .max(110),
    email: Joi.string()
        .required()
        .email()
})

io.on("connection", socket => {

    socket.on("chat-message", msg => {
        io.emit("chat-message", msg)
    })

    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId)
        socket.broadcast.emit("user-connected", userId)

        socket.on("disconnect", () =>
            socket.broadcast.emit("user-disconnected", userId))
    })
})

app.use("/component", express.static(path.join(__dirname, "../frontend/components")))
app.use("/global", express.static(path.join(__dirname, "../frontend")))

app.get("/auth", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/components/auth/index.html"))
})

app.get("/generateRoomId", (req, res) => {
    res.send(guid())
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/components/home/index.html"))
})

server.listen(port, () => {
    console.log(`App listening on port ${port}`)
})

function guid() {
    let s4 = () => Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1)
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
}