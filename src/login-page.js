import React from 'react'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import CircularProgress from '@material-ui/core/CircularProgress'
import axios from 'axios'
import './login-page.css'

const fieldStyle = {
    marginBottom: '1rem',
}

const buttonStyle = {
    marginTop: '1rem'
}

const spinner = () => (
    <CircularProgress color="secondary" />
)

export default class LoginPage extends React.Component {
    state = {
        username: '',
        password: '',
        loading: false
    }

    render() {
        const { loading } = this.state
        return (
            <form onSubmit={(e) => e.preventDefault()}>
                <div className="login-window">
                    <Typography style={{ marginBottom: '.5rem' }} variant="h6" >Авторизуватися</Typography>
                    <TextField
                        label="Ім'я користувача"
                        onChange={(event) => this.setState({ username: event.target.value })}
                        style={fieldStyle}
                    />
                    <TextField
                        label="Пароль"
                        type="password"
                        style={fieldStyle}
                        onChange={(event) => this.setState({ password: event.target.value })}
                    />
                    <Button variant="contained" color="primary" type="submit" style={buttonStyle} onClick={this.login.bind(this)} >
                        Увійти
                        {loading && <CircularProgress style={{ marginLeft: '.5rem' }} color="#fff" size={20} />}
                    </Button>
                </div>
            </form>
        )
    }

    login() {
        // FIXME: get from env
        this.setState({ loading: true })
        const apiBaseUrl = "http://localhost:8011/"
        const { username, password } = this.state
        const payload = { username, password }

        axios.post(apiBaseUrl + 'login', payload)
            .then(function (response) {
                console.log(response)
                if (response.data.code === 200) {
                    console.log("Login successfull")
                }
                else if (response.data.code === 204) {
                    console.log("Username password do not match")
                    alert("username password do not match")
                }
                else {
                    console.log("Username does not exists")
                    alert("Username does not exist")
                }
            })
            .catch(function (error) {
                console.log(error)
            })
    }
}