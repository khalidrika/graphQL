
function formlogin() {
    const element = document.getElementById("app")

    const divlogin = document.createElement('div')
    divlogin.className = "login"

    element.appendChild(divlogin)

    const formlogin = document.createElement('form')
    formlogin.className = "formlogin"

    divlogin.appendChild(formlogin)


    const welcome = document.createElement('h2')
    welcome.className = "welcome"
    welcome.textContent = "login"

    const input = document.createElement('input')
    input.type = 'text'
    input.className = "input"
    input.placeholder = "Enter your email or username"

    const passwor = document.createElement("input")
    passwor.type = "password"
    passwor.placeholder = "Enter you password"
    passwor.className = "password"

    const button = document.createElement('button')
    button.className = "submit"
    button.textContent = "submit"

    formlogin.appendChild(welcome)
    formlogin.appendChild(input)
    formlogin.appendChild(passwor)
    formlogin.appendChild(button)
}
formlogin();