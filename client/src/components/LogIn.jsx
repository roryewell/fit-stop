var Login = (props) => (
  <div className="loginPage">
    <h1>Log In</h1>
    <form onSubmit={props.login}>
      <label htmlFor="username">Username:</label>
      <input id="username" type="text" name="username"/>
      <label htmlFor="password">Password:</label>
      <input id="password" type="password" name="password"/>
      <input type="submit" value="Log In"/>
    </form>
    <br />
    <h1>or</h1>
    <button className="loginBtn loginBtn--facebook">Log in with Facebook</button>
  </div>
);


window.Login = Login;
