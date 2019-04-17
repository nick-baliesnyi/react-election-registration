import React from 'react'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import FormHelperText from '@material-ui/core/FormHelperText';
import CircularProgress from '@material-ui/core/CircularProgress'
import { ICONS } from '../../utils/icons.js'
import ERRORS from '../../utils/errors.json';
import { showNotification } from '../../utils/functions';
import axios from 'axios'
import './index.css'

const fieldStyle = {
    marginBottom: '.5rem',
}

const buttonStyle = {
    marginTop: '.5rem'
}

const Spinner = () => (
    <CircularProgress style={{ marginLeft: '.5rem', color: '#fff' }} color="inherit" size={20} />
)

export default class LoginWindow extends React.Component {
    state = {
        username: '',
        password: '',
        loading: false
    }

    handleError(code) {
        const error = ERRORS[code] || {}
        console.log(error.title, error.message)
        showNotification({
            title: error.title,
            message: error.message,
            icon: ICONS.login,
        })
    }

    render() {
        const { loading } = this.state
        return (
            <form onSubmit={(e) => e.preventDefault()} className="login-window">
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
                        {loading && <Spinner />}
                </Button>
                <FormHelperText style={{ marginTop: '1rem', lineHeight: '1.3', textAlign: 'center' }}>
                    Або перейти до <a style={{ fontSize: 'inherit', color: '#f44336' }} href="/admin/" rel="noopener noreferrer" target="_blank">адмін панелі</a>.
                </FormHelperText>
            </form>
        )
    }

    login() {
        const { username, password } = this.state
        if (!username || !password) return
        this.setState({ loading: true })
        const payload = { username, password: btoa(password) }

        axios.post('/login', payload)
            .then(response => {
                console.log(response)
                this.setState({ loading: false })

                const authToken = response.data.auth_token
                if (authToken) {
                    console.log("Login successfull")
                    this.props.onSuccess(authToken)
                }
                else if (response.data.error && response.data.error.code) {
                    this.handleError(response.data.error.code)
                }
                else {
                    console.log("Unexpected response")
                    alert("Непередбачена відповідь.")
                }
            })
            .catch(err => {
                this.setState({ loading: false })
                this.handleError(513)
                console.log(err)
            })
    }
}