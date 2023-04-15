import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import { createCode } from "supertokens-web-js/recipe/passwordless";
import { getLoginAttemptInfo } from "supertokens-web-js/recipe/passwordless";
import { consumeCode } from "supertokens-web-js/recipe/passwordless";
import SuperTokens from 'supertokens-web-js';
import Session from 'supertokens-web-js/recipe/session';
import Passwordless from 'supertokens-web-js/recipe/passwordless'
import { environment } from 'src/environments/environment';
import * as intlTelInput from 'intl-tel-input';
import { MainService } from '../services/main.service';

console.log(environment.API_BASEPATH);
SuperTokens.init({
  appInfo: {
    apiDomain: environment.API_BASEPATH,
    apiBasePath: "/auth",
    appName: "Phangan Sports Community",
  },
  recipeList: [
    Session.init(),
    Passwordless.init(),
  ],
});

@Component({
  selector: 'app-auth-magic-link',
  templateUrl: './auth-magic-link.component.html',
  styleUrls: ['./auth-magic-link.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthMagicLinkComponent implements AfterViewInit {

  state: 'phone' | 'email' | 'otp_code' = 'phone';

  phone: string = '';

  email: string = '';

  otp_code: string = '';

  go_to_otp = false;

  rememberMeChecked = true;

  initTelInputOnce = false;
  constructor(private mainService: MainService) {
  }

  ngAfterViewInit(): void {
    this.initLogic();
  }

  initLogic() { // settimeout(0) verify that we do it after html loaded
    setTimeout(() => {
      this.initStorage();
      this.initTelInput();
      this.handlePhoneValidator(this.phone);
    }, 0);
  }

  loading = false;

  async submitCodeCreation() {
    if (this.loading === true) {
      return;
    }

    this.loading = true;

    let identifier = '';
    if (this.state === 'email') {
      identifier = this.email;
    } else if (this.state === 'phone') {
      identifier = `+${this.mainService.intlCountryData.dialCode}${this.phone}`;
    }
    try {
      const response = await this.createCode(identifier);
      if (response.status === "RESTART_FLOW_ERROR") {
        // this can happen if the user has already successfully logged in into
        // another device whilst also trying to login to this one.
        window.alert("Login failed. Please try again");
      } else {
        // OTP resent successfully.
        this.state = 'otp_code';
      }
    } catch (err: any) {
      if (err.isSuperTokensGeneralError === true) {
        window.alert(err.message);
      } else {
        window.alert("Oops! Something went wrong.");
      }
    }
    finally {
      console.log('finally');
      this.loading = false;
    }
  }

  async createCode(identifier: string) {
    let response: {
      status: "OK" | "RESTART_FLOW_ERROR";
      fetchResponse: Response;
    };
    if (this.state === 'email') {
      response = await createCode({
        email: identifier
      });
    } else {
      response = await createCode({
        phoneNumber: identifier
      });
    }
    return response;
  }

  updateState() {
    if (this.state === 'email') {
      this.state = 'phone';
      setTimeout(() => {
        this.initTelInput();
      }, 0);
    } else {
      this.state = 'email';
    }
    this.error = '';
  }

  error = '';

  handlePhoneValidator(event: string) {
    this.phone = event;
    const phone = `+${this.mainService.intlCountryData.dialCode}${this.phone}`;
    const validate = this.mainService.PhoneNumberValidatorManually(phone);
    if (validate) {
      this.error = '';
      this.go_to_otp = true;
    } else {
      this.error = 'Invalid phone number';
      this.go_to_otp = false;
    }
  }

  handleEmailValidator(event: string) {
    this.email = event;
    const regexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    if (regexp.test(this.email)) {
      this.error = '';
      this.go_to_otp = true;
    } else {
      this.error = 'Invalid email';
      this.go_to_otp = false;
    }
  }
  async hasInitialOTPBeenSent() {
    return await getLoginAttemptInfo() !== undefined;
  }

  iti: intlTelInput.Plugin = null;

  initTelInput() {

    const phoneInput = document.getElementById('phoneInput');

    this.iti = intlTelInput((phoneInput as Element), {
      utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.0.0/js/intlTelInput.min.js',
      separateDialCode: true,
      allowDropdown: true,
      initialCountry: this.mainService.intlCountryData.iso2,
      preferredCountries: [],
      dropdownContainer: document.body
    });

    phoneInput.addEventListener('countrychange', () => {
      const newCountryData = this.iti.getSelectedCountryData();
      this.mainService.updateIntlCountryData(newCountryData);
    });
  }

  initStorage() {
    const secondFormValues = this.mainService.get('secondForm');
    if (secondFormValues && secondFormValues?.phone) {
      this.phone = secondFormValues.phone as string;
    }
  }

  handleOtpValidator(event: string) {
    this.otp_code = event;
    if(this.otp_code.length === 6) {
      console.log('handleOtpValidator', this.otp_code.length);
      this.handleOTPInput(this.otp_code);
    }
  }

  handleAction() {
    if (this.state !== 'otp_code') {
      this.submitCodeCreation();
    } else {
      this.handleOTPInput(this.otp_code);
    }
  }
  async handleOTPInput(otp: string) {
    try {
      console.log('enter handleOTPinput', otp);
      let response = await consumeCode({
        userInputCode: otp
      });
      console.log(response);
      if (response.status === "OK") {
        if (response.createdNewUser) {
          // user sign up success
        } else {
          // user sign in success
        }
        // window.location.assign("/home");
      } else if (response.status === "INCORRECT_USER_INPUT_CODE_ERROR") {
        // the user entered an invalid OTP
        window.alert("Wrong OTP! Please try again. Number of attempts left: " + (response.maximumCodeInputAttempts - response.failedCodeInputAttemptCount));
      } else if (response.status === "EXPIRED_USER_INPUT_CODE_ERROR") {
        // it can come here if the entered OTP was correct, but has expired because
        // it was generated too long ago.
        window.alert("Old OTP entered. Please regenerate a new one and try again");
      } else {
        // this can happen if the user tried an incorrect OTP too many times.
        window.alert("Login failed. Please try again");
        // window.location.assign("/auth")
      }
    } catch (err: any) {
      if (err.isSuperTokensGeneralError === true) {
        // this may be a custom error message sent from the API by you.
        window.alert(err.message);
      } else {
        window.alert("Oops! Something went wrong.");
      }
    }
  }

  forgotAccount() {
    window.alert('Contact Us at +33 695 76 54 75 (Whatsapp) or by e-mail (leclubvillaphangan@gmail.com)')
  }
}
