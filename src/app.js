import React, { Fragment } from 'react'
import axios from 'axios'
import Raven from 'raven-js'
import Quagga from 'quagga'
import { MuiThemeProvider } from '@material-ui/core/styles';
import { QUAGGA_OPTIONS } from './plugins/quagga-options.js'
import SessionWindow from './components/session-window/session-window.js'
import NewSessionWindow from './components/new-session-window/new-session-window.js'
import PrintingWindow from './components/printing-window/printing-window'
import ConsentDialog from './components/session-doc-input/consent-dialog.js'
import Ballot from './components/ballot/ballot'
import Header from './components/page/header.js'
import Footer from './components/page/footer.js'
import { THEME } from './theme.js'
import { BarLoader } from 'react-spinners';
import { css } from 'react-emotion';
import { message } from 'antd'
import { ICONS } from './utils/icons.js'
import '../node_modules/izitoast/dist/css/iziToast.min.css'
import './utils/override-izitoast.css'
import errors from './utils/errors.json';
import LoginWindow from './login-window.js'
import { isMobileScreen, showNotification } from './utils/functions.js';

const spinnerStyles = css`
  position: absolute !important;
`

// retrieving environment variables
const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL || 'http://localhost:8000'

const backend = axios.create({
  baseURL: BACKEND_BASE_URL,
  withCredentials: true,
  timeout: 5 * 1000,
})

const initialState = {
  activeStudent: null,
  activeStudentName: '',
  auth: { loggedIn: false, user: '' },
  ballotNumber: null,
  ballotPrinted: false,
  docNumber: null,
  docType: null,
  doRevoke: false,
  sessionIsOpen: false,
  checkInSessionToken: null,
  students: [],
  loading: false,
  studentSubmitted: false,
  printerError: null,
  showConsentDialog: false,
  searchQuery: '',
}

export default class App extends React.Component {
  state = { ...initialState }

  render() {
    const { loggedIn } = this.state.auth
    const { loading, studentSubmitted, ballotNumber, showConsentDialog } = this.state

    return (
      <div className="page-content-wrapper " >

        <MuiThemeProvider theme={THEME}>
          <div className="header-and-content">
            <Header auth={this.state.auth} onCloseSessions={this.closeSessions.bind(this)} />
            <BarLoader
              color="rgba(33, 150, 243, 0.8)"
              className={spinnerStyles}
              loading={this.state.loading}
              width={100}
              widthUnit={"%"}
              height={3}
            />

            <div className="content">
              {!loggedIn && <LoginWindow url={BACKEND_BASE_URL} onSuccess={this.onSuccessfulLogin.bind(this)} />}
              {loggedIn && !this.state.sessionIsOpen &&
                <NewSessionWindow onSessionStart={this.startSession.bind(this)} loading={loading} />
              }

              {loggedIn && this.state.sessionIsOpen &&
                <SessionWindow
                  activeStudent={this.state.activeStudent}
                  status={this.state.status}
                  students={this.state.students}
                  onSearchBack={this.searchGoBack.bind(this)}
                  onStudentSubmit={this.registerStudent.bind(this)}
                  onStudentSelect={this.selectStudent.bind(this)}
                  onScanStart={this.initScan.bind(this)}
                  onScanCancel={this.cancelScan.bind(this)}
                  onCancelSession={this.cancelSession.bind(this)}
                  onCompleteSession={this.completeSession.bind(this)}
                  onSearchByName={this.searchStudentByName.bind(this)}
                  onStudentUnselect={this.unselectStudent.bind(this)}
                  voteOptions={this.state.voteOptions}
                  loading={loading}
                />}

              {studentSubmitted &&
                <Ballot
                  number={ballotNumber}
                  onComplete={this.completeSession.bind(this)}
                  onCancel={this.cancelSession.bind(this)}
                />
              }

              {showConsentDialog &&
                <ConsentDialog
                  studentName={this.state.activeStudentName}
                  onComplete={this.confirmConsent.bind(this)}
                  onCancel={this.cancelConsent.bind(this)}
                />
              }
            </div>
          </div>
          <Footer />
        </MuiThemeProvider>
      </div>
    )
  }

  componentDidMount() {
    message.config({
      maxCount: 1,
      duration: 5
    })
  }

  getAuth(token) {
    this.setState({ loading: true })
    console.log('getting auth')

    backend.post('/me', {})
      .then(res => {
        this.setState({
          auth: {
            loggedIn: true,
            user: `${res.data.data.staff.first_name} ${res.data.data.staff.last_name}`,
            token,
          },
          loading: false
        })
      })
      .catch(err => {
        localStorage.setItem('authToken', '')
        this.setState({
          auth: {
            loggedIn: false
          },
          loading: false
        })
        alert(err)
      })

  }

  onSuccessfulLogin(authToken) {
    backend.defaults.headers = {
      'X-Auth-Token': authToken
    }

    this.getAuth(authToken)
    this.closeSessions()
  }

  closeSessions() {
    backend.post('/close_sessions', {})
      .catch(err => {
        console.warn(err)
      })
  }

  startSession() {
    console.log('Starting new session...')
    this.setState({ loading: true })
    backend.post('/start_new_session', {})
      .then(res => {
        if (!res.data.error) {
          const checkInSessionToken = res.data.data.check_in_session.token

          this.setState({
            sessionIsOpen: true,
            checkInSessionToken,
            status: 'Знайдіть студента в базі',
            loading: false
          })
        } else {
          return this.registerError(res.data.error.code)
        }

      })
      .catch(err => {
        this.handleApiError(err)
      })
  }

  buildFoundStudentsNote(numOfStudents, query) {
    return (
      <>
        <div>{numOfStudents > 1 ? 'Оберіть' : 'Перевірте дані та зареєструйте'} студента</div>
        За запитом <strong>{query}</strong> знайдено {numOfStudents} студент{numOfStudents > 1 ? 'ів' : 'а'}
      </>
    )
  }

  searchStudentByName(name) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.student = {}
    data.student.full_name = name

    console.log('Searching student by name:', name)

    this.setState({ loading: true, searchQuery: name })

    backend.post('/search_by_name', data)
      .then(res => {
        if (res.data.error) return this.registerError(res.data.error.code, false)

        const foundStudents = res.data.data.students
        let students = foundStudents.map(student => {
          return this.buildStudentData(student)
        })
        this.setState({
          students,
          status: this.buildFoundStudentsNote(students.length, name),
          loading: false
        })
      })
      .catch(err => {
        this.handleApiError(err)
      })
  }

  buildStudentData(student) {
    let data = {
      name: student.data.full_name,
      degree: student.data.educational_degree === 1 ? 'Бакалавр' : 'Магістр',
      formOfStudy: student.data.form_of_study === 1 ? 'Денна' : 'Заочна',
      structuralUnit: student.data.structural_unit,
      specialty: student.data.specialty,
      year: student.data.year,
      token: student.token,
      hasVoted: student.has_voted
    }
    return data
  }

  selectStudent(student, doRevoke) {
    this.setState({
      activeStudent: student,
      activeStudentName: student.name,
      doRevoke,
      status: 'Введіть номер підтверджуючого документа',
    })
    this.openConsentDialog()

  }

  openConsentDialog() {
    this.setState({ showConsentDialog: true })
  }

  confirmConsent() {
    this.setState({ showConsentDialog: false })
    console.log('consent given', this.state.activeStudent)
  }

  cancelConsent() {
    this.unselectStudent()
    this.setState({ showConsentDialog: false })
  }

  registerStudent(student) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.do_revoke_ballot = student.doRevoke
    data.student = {}
    data.student.token = student.token
    data.student.doc_type = student.docType
    data.student.doc_num = student.docNumber

    this.setState({ loading: true })

    console.log(`Submitting student with doc_num ${data.student.doc_num} (type ${data.student.doc_type}), token ${data.student.token}`)

    backend.post('/register_student', data)
      .then(res => {
        if (res.data.error) return this.registerError(res.data.error.code)
        let ballotNumber = res.data.data.ballot_number
        ballotNumber = '18-20-39-93'
        this.setState({ studentSubmitted: true, ballotNumber })
      })
      .catch(err => {
        this.handleApiError(err)
      })
  }

  searchGoBack() {
    console.log('Going back to Search...')
    this.setState({
      students: [],
      status: 'Знайдіть студента в базі',
    })
    this.searchStudentByTicketNumberStarted = false
  }

  unselectStudent() {
    console.log('Unselecting student...')
    this.setState({
      activeStudent: null,
      status: this.buildFoundStudentsNote(this.state.students.length, this.state.searchQuery),
    })
  }

  completeSession = (config) => {
    config.check_in_session_token = this.state.checkInSessionToken
    backend.post('/complete_session', config)
      .then(res => {
        // 508 - already closed
        if (!res.data.error || (res.data.error || {}).code === 508) {
          const studentName = this.state.activeStudentName
          message.success(studentName + ' – зареєстровано!')
          this.onSessionEnd()
        } else {
          this.registerError(res.data.error.code)
        }
      })
      .catch(err => {
        console.warn(err)
        this.handleApiError(err)
      })
  }

  componentDidCatch(err, errInfo) {
    Raven.captureException(err, { extra: errInfo });
  }

  handleApiError(err) {
    console.warn('Handling API error:', err)
    console.log(err.status)

    // check Network Error
    if (!err.status && !err.response) {
      console.warn('[API ERROR HANDLER] Network error detected')
      this.registerError(513)
      return
    }

    switch (err.response.status) {
      case 400:
        // FIXME: deal with bad requests
        break
      case 403:
        message.warn('Відмовлено в доступі.')
        break
      default:
        this.registerError(300)
    }
    this.setState({ loading: false })

  }

  registerError(code, silent = false, options) {
    this.setState({ loading: false })

    let error = errors[code]
    if (300 <= code && code < 400) {
      error = {
        title: 'Невідома помилка',
        message: 'Зверніться в службу підтримки',
        icon: ICONS.bug,
      }
    }
    if (!error) error = {}
    let title = `${error.title || 'Помилка'} [${code}]`

    if (!silent) {
      showNotification({
        title,
        message: error.message || '',
        icon: error.icon || ICONS.errorIcon,
      })
    }

    console.log(title)
    Raven.captureException(new Error(title))
  }

  cancelSession() {
    const token = { check_in_session_token: this.state.checkInSessionToken }

    console.log('Canceling session...')
    this.setState({ loading: true })
    backend.post('/cancel_session', token)
      .then(res => {
        if (res.data.error) this.registerError(res.data.error.code, true)
        this.onSessionEnd()
      })
      .catch(err => {
        this.handleApiError(err)
      })
  }

  onSessionEnd() {
    message.destroy()
    this.barcodeScanned = false
    this.setState({ ...initialState, auth: this.state.auth })
    try {
      Quagga.stop()
    } catch (err) {
      console.log('Quagga stop error: ', err)
    }
  }

  initScan() {
    this.setState({ loading: true })
    this.barcodeScanned = false
    Quagga.init(
      { ...QUAGGA_OPTIONS, inputStream: { ...QUAGGA_OPTIONS.inputStream, target: document.querySelector('.scanner-container') } },
      (err) => {
        if (err) {
          this.registerError(506)
          return
        }
        Quagga.start()
        this.setState({
          loading: false
        })
        message.info('Піднесіть студентський квиток до камери')
        this.initOnDetected()
      })
  }

  cancelScan() {
    Quagga.stop();
    this.setState({
      status: 'Введіть номер підтверджуючого документа',
    })
    message.destroy()
  }

  initOnDetected() {
    Quagga.onDetected((data) => {
      // prevent multi-requests
      if (this.barcodeScanned) return

      const number = data.codeResult.code
      if (number.length === 8) {
        console.log('Successfuly scanned ticket:', number)
        this.barcodeScanned = true
        message.destroy()
        Quagga.stop()

        let activeStudent = this.state.activeStudent
        activeStudent.docNumber = number
        activeStudent.docType = '0'
        this.setState({ activeStudent })
        message.success('Студентський квиток відскановано.')

      } else {
        this.registerError(507)
      }
    })
  }

}