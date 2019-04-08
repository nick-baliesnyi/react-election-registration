import React from 'react';
import Button from '@material-ui/core/Button';
import { ICONS } from '../../utils/icons.js'
import './student-info.css'

export default class StudentInfo extends React.Component {
  state = {
    disabled: false
  }

  handleSelect(student) {
    console.log(`Selecting student ${student.name} (Year: ${student.year}, Specialty: ${student.specialty})`)

    const doRevoke = this.props.data.status === 2

    this.props.onSelect(student, doRevoke)
    this.setState({
      disabled: true,
    })
  }

  componentDidMount() {
    if (this.props.activeStudent) this.setState({ disabled: true })
    if (this.props.data.hasVoted === true) this.setState({ disabled: true })
  }

  render() {
    const { name, degree, year, activeStudent, formOfStudy, specialty, structuralUnit, hasVoted } = this.props.data
    const student = this.props.data
    let { disabled } = this.state
    let classes = ['student']
    let screenWidth = window.innerWidth

    if (disabled) classes.push('disabled')

    let buttonName = ''

    switch (hasVoted) {
      case false:
        buttonName = 'Зареєструвати'
        break
      case true:
        buttonName = 'Зареєстровано'
        break
      default:
        buttonName = 'Зареєструвати'
    }

    return (
      <div className={classes.join(' ')}>
        {/* <div className="status-line"></div> */}

        <div className="data">
          <div className="student--name">{name}</div>
          <div className="student--info">
            <div>{structuralUnit}</div>
            <div>{specialty}</div>
            <div>{year ? `${year} курс | ` : ''}{degree} | {formOfStudy}</div>
          </div>
        </div>

        <div className="actions">
          {!activeStudent &&
            <Button disabled={disabled} variant="contained" color="primary" onClick={() => { this.handleSelect(student) }}>
              {buttonName}
            </Button>
          }
        </div>

      </div>
    )
  }

}
