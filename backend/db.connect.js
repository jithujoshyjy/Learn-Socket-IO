import mongoose from "mongoose"
import { readFile } from "fs/promises"

export async function dbConnect() {

    const username = process.env.MONGODB_USERNAME,
        password = process.env.MONGODB_PASSWORD
    
    if(!(username && password))
        return;

    //Set up default mongoose connection
    const connectionString = `mongodb+srv://${username}:${password}@cluster0.utm0d.mongodb.net/users?retryWrites=true&w=majority`
    mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

    //Get the default connection
    const db = mongoose.connection;

    //Bind connection to error event (to get notification of connection errors)
    db.on('error', console.error.bind(console, "MongoDB connection error:"))

    const { Schema, model } = mongoose

    const schema = new Schema({
        username: String,
        password: String,
        email: String,
        Age: Number
    })

    const _model = model("User", schema)

    return db
}