import { el, els, on, store } from "/global/global.utility.js"

const authForm = el("form.user-auth")
const userNameField = el("input.user-name-field")
const createAccLink = el("a.create-account")

let action = "login"

on(authForm, "submit", handleAuthFormSubmit)

on(createAccLink, "click", evt => {
    evt.preventDefault()
    action = "register"
    handleAuthFormSubmit(evt)
    action = "login"
})

function handleAuthFormSubmit(evt) {
    evt.preventDefault()
    const userName = userNameField.value
    if (userName) {
        store.clear()
        store.set("user", { name: userName })

        action == "login" ?
            alert("Logged in successfully!") :
            alert("Registered successfully!")

        authForm.reset()
        location.href = "/"
    }
}