import React, {createRef} from 'react'
import ReCAPTCHA from "react-google-recaptcha";

// requestInventory
class Main extends React.Component {

    constructor (props) {
        super(props);
        this.captcha = createRef();
    }


    send = () => {
        const recaptchaValue = this.captcha.current.getValue();
        //console.log("Captcha", recaptchaValue);
        this.captcha.current.reset();
        this.props.submit(recaptchaValue);
    }

    render () {
        return (
            <ReCAPTCHA
                sitekey="6LefWTAaAAAAAIeeXuXO0VJ0RjioqSGXbNBvaJc_"
                // sitekey="6Ldrf6wZAAAAAP9TRkdhz3DguPJyb4jpsW_uMdf5"
                ref={this.captcha}
                onChange={this.send}
            />
        )
    }
}

export default Main;