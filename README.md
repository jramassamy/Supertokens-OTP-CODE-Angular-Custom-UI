# Supertokens-OTP-CODE-Angular-Custom-UI
Supertokens Example for OTP Code In Angular using your Own Custom-UI and not React one
Do not forget to:

- Install TailwindCSS (https://tailwindcss.com/docs/guides/angular)
- Install intl-tel-input (npm install intl-tel-input)
- Add it to the routes

const routes: Routes = [
...
  {
    path: 'auth',
    component: AuthMagicLinkComponent
  }
];

In Styles.css I have this code, don't know if it will help:


.iti__country-list {
    overflow-x: hidden !important;
    max-width: 250px;
}

.iti__country-name, .iti__flag-box {
    font-family: 'Open Sans', sans-serif;
}
