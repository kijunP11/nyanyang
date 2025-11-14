const themeCookie = document.cookie
  .split("; ")
  .find((row) => row.startsWith("theme="))
  ?.split("=")[1];

if (themeCookie) {
  const data = JSON.parse(atob(decodeURIComponent(themeCookie)));
  const theme = data.theme;
  if (theme === "dark") {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }
}
