// =====================
// 2026 TEAM IDENTITY UPDATES
// Keeps historical team IDs intact while applying current names/logos site-wide.
// =====================

// Force browsers to fetch the current team-logo fit rules instead of reusing
// an older cached copy after logo-specific framing adjustments.
const logoFitStylesheet2026 = document.querySelector('link[href*="invincibles-logo-fit.css"]');
if (logoFitStylesheet2026) {
  logoFitStylesheet2026.href = "./invincibles-logo-fit.css?v=20260814-drhtown-exact-reference";
}

// Dr. H-Town's current logo is embedded directly from the exact clean reference
// crop so its framing stays identical everywhere and is not affected by image-cache
// or binary-asset corruption issues.
const DRHTOWN_LOGO_2026 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCACAAIADASIAAhEBAxEB/8QAHQAAAQUBAQEBAAAAAAAAAAAABwMEBQYIAAIJAf/EAEMQAAEDAwIEAwQGCAUCBwAAAAECAwQABREGIQcSMUETUWEIFHGBIjJikaGxFSMzQlKCkvAWJEPB4WPCNERTcqSy0f/EABkBAAMBAQEAAAAAAAAAAAAAAAIDBAEABf/EACARAAMAAgICAwEAAAAAAAAAAAABAgMREiEEMTJBURP/2gAMAwEAAhEDEQA/AMo11e1oABIV07V4r2iE6vynVqt8263Bm326K5KlPK5W2mxkqP8AsB3J2HejHonQtosTzD1yQxd7nzAkqHNGjnySD+0UP4j9HyB60vJknGts2ZdPSKLozhnq3VMNy4xLeqLamUFx2fKBQ0lI6kbZV8hVwtPD7S0EAzPfby8OviK93Z+SU5UR8VCtft2dnUvD5y0RXm2PeovK2sDYL2Izjtkb+lAXUGlr3YJCmLvbJEYpOAvlJbWPNKxsRUNeXVfHopWBL2V+DFg28D9GWe1QcdCzEQVf1KBV+NPzcroRgXCSMdAlZA+4V6Qynl5iRjuc7Ck3JMBBCVzYaSdhl9IP50p3b+w1Mo9JuN2CcGfJOeoU4SPuNMpsSBcUn9J2e1zs9VOxEBX9SQFfjT1x6ChfKuZFSoDPKXkg/nSjaW3Ec7SkrT/ElQI/CuV2vs7jL+ilXbhzpifzGCZlnePTkV7wz80qwoD4KNUfVfD3U2nYguD8P3y2K+pOigrax9rbKfmKP9l05eLy+lq122TJJ6lKDyj1KjsB86NOg9Oqs8A2e4oalNKR+uSocyCokkgZ7DOM02fLqfl2BWFP0fOuurRHHXhdp9Wr7kzptDVqkoKVpbz+odKkglJ/gOT9YbeY70ALlBmW2c7Bnx3I8llXK42sYIP+49ehq+Mk2tomqXL0xtXV1Kx0BRJKebHajMEac2qBMulxj263sKkSpCwhptPVRP5DuT2AJptkf2aMvDXT4sFjTcJDeLrc2ebfrHjK6J9FL6n7OB3NBktRO2bMunoltKWGDpi2qhQVIfmPJxNmgftf+mjybB/q6nsBLtJOxGxFeGk4xinKcpbUpCeZfKeVPmcbCvKu3b2y2ZUrSCHw/wBffoFCYtxViMo4Ss/uenwotta7sq7YqS9NjhgI5lFSgQBjvXzjuvEHV5uLvPdHY25SplLaeRO+6eUg9Om9Mv8AGeo5DT0RVwIjutqS4hKcJwdjjHSh4P0bz2XjjDxFY1zrq43NphwW/wATwoUZhYZQllJwFEJG6lbqJPn6VQnm4j5JirktEDK0ur5sHsM0RV8O9J2jhTbLndbhPOrr3EdnwYzXL4LLCAVAucxHUJPcknYDbemwobTkMOvgB9W+O4+NUR30IvojYyUR2i/LWt0A4IQrfPbNTGnL+YU5mXDD8ByMsOokIfOUKTuNjkH4Y36UzMYE+GlYAzuCOvpRj4FaQ4Vait8nT2smrgm63GSiPElMvhtuEXAQyAObK1KUlRyUqSPog4zmmUmkAmmzVXC3iHA1hw+tt9Q4y0t1vkkNIOEoeTstOO2+49CKhdT8QbZAkOtQ1JkyU7cjZzy/HyrFWoLrq7hyu76Kg3ZyMm33N1mUGxgLUPo84J3AUADj1quo1rqh1xtH6YkgA7IZV4Yz5nl/OpXG2UK+jS13lv3O5SJ8ohT76ypXp6VWNaaZh6mt4Ye5GJzKcRZRH1fsL80H8Oo7inuinJ0vSlvk3JRXKca5lKIwVDJ5SfUjFSy2z1rZpxW0a5VLszLcYUq3TnoM1lTElhZQ42rqCP7696QBI6EijLxZ00LtaTeIrWZ8JGXAkbvMjqPUp6j0yOwoM5FepjtXO0RVLl6ZZeGtjavmqGkTEc1vhoMuYP4kJIwj+ZRSn5mjGp5yRIckPEFbiipWOmfIelVHhlD9y0WqYoDx7rJJzj/RZ+iB81qUf5RVqj74qLyr3XH8KMM6Wx6yCRTthOaaMHzNPo9SjwZ8TuG0i6THLvYENqfdPM/GUoJ5lfxJJ2ye4NCd+zzLbKdhT2VRpSFYcbV1R3wcd961i0MgAjqazDrqQf8AFV1eUskqlu7n0WaZPfsXSJjVF9RqZvTjMllQkWe3oguDOUOBBPIR5HB3+FKENiMhAU3zeSDgf81Tozy246VJUOZxROfyp7br06UgOp5yk9D2xTYaQu02SpKVPcqjy+Wds1ZdNJtlu1FZdRXBuQ83apSH1oYIC3EJPMlOTt1GM+RNVdq6NKPM3DQ4og7kf399OLXOfkWx5uQhKFrbUAkeWdqYu/Yv0SGu5w1jqe+6okHwTd5S31tEZDRUdhnuEgCn/DvhdPkzGLjfGkR4IAWhtKwpTw6jGOiT5neqNAui1tiMlPQ4PwzWkOHS1O6Ita1HJ8IgH0CjikW1rodC77JUNpQkISAlKRgJAwAK8L6Ypy4KScTvSRw1OysgD59Kz9xFsYsOqZEVlHLFe/XxvRCv3fkcj5CtCKTvQ844Wz3jT0a6JT+shvcij/017fgoD76p8W9Vr9E5p2tklGYEC12m2YwYluYQofbUnxFfis08jq6b1+ai+jqKegbBt4oHwSAkflXiOegNJyPdNjI+KJNo+tPmFdB0qNYp+yfKgCJNlWwx51m7i1ZH7Rq+ahaD4Epan2FdlJUc/eDkVoxg7ZJqM1hpy3amsL7NwAbbjoU6JfT3bAyVE9MYG4PWtT0C1sywhxIbS2tXLjdKu3wpzHkNNK5uZsg9silr3aZNvW22+ytAfaTJjqWnlLjKs8qwOoBxnem9ngsypHgPOoZKvqqWcD4ZonfBbNx4v60oT9j+NdG2cFBaSvsebb516bme8yFqbVzrWMEpTgJT/v8A805n2G22+0KcdlNPTHPotttrzy/aOPy71+6ds0uY/HtsCOt6fOcTHjtJ+stSj0Hr+VFizPIt/RnkeN/CuLe2NIMdc2W3GiRypxawlCEDdRPQCtQ6bt5tWn4FuUrKo7CUKI7q6n8Saj9P8HLvoK/6Y9990nTL4l6MkJ2EWSlHiJQlR2PMgKGTjcbbGrRcIcuBKVGmxnY7yeqHEFJ/5obewYnQ1WNqSUOuaXI2pJY9KAYILTtmoLW0MT9JXWLjJXFWU/8AuSOYfiKsC6ay0Bcd1B6KSUn5jFHjeqTBrtMq+ol51HPWDs494g+CgFD86Tjr6b0yEoTrZabnn/xduZUo/bQPDV+KKWYIGD5V2Rato6O5RLx1mpO3NOyZDceO2px1xQShCRkkmoaOvoaI2nJdl0FoeRxB1EXHArDURppPMtXMoownOwUT37J+NAjQi2Th1YrbHSqehdwkpA5y4rDYONwEjqPjVA47sN3GVp7Q8UMw2LzMIfQ2A2ExWhzu+W6sIT/MRRR0BrKza70s3fLI4stOP+E424nC2nBy5Sof7jYiqiIaLv7QE155hD0Wy2hmInmGQh6QtTvN8cIQPmK1o1MzR7WlrVa9WWeUhsJZXD8FCQMABvGB9xoMtvozkFG/UKrV/tx2ZCdKaYuKUDn9/eaJ7kFvP/bWSzCcU4AEnBO1MlNT0LprY8jPpUtISGkq+wnJrTnsU6AM7UknX9xR/lraFRoXN0Lyk/TV/Kk4z5q9KznZ7Y4Hm2mmy6+6oIQkDdSicAD4kivpNwy0xF0Lw5tVhGB7lGCpTg/fdI5nVf1E/hR2uM9+wY7eyucXp0Jd74ftNPAvjVLC0JAOeQIWFEbbj6QB+Iq83W0W69Q/dblFbkIH1SdlI9UnqKEVi0DbeKOnHdbamkXRFyuy3XoCmZy0JgMBRDKWwDjACQo56k1eOB12ud44X2a4Xh9UmaULaW+rq8G1qQHD6kJBpI0r2rOGK4UV+dZ5niNNIKyw+Pp4HZKhsfnihkSK1MopWnCgCDtg96DHFnSCbQ/+mLayEwXVYdbSNmVny+yfwPyrDgdrA65ppPWGorrpOAhCifkKdrxVd4gzRA0hdJGcK93UlPxV9EfnRY1ukgaekwf8PJnv2i3IZOXrVKKgO/gvf/jiT/XU9HPShnoG8tWXUbTstRECSgxpmOzS+qvikhKv5a0Vwi0InUGoJIu61Jt8BaQ54Z/bqO4SD/CRg5HYjzp/lRquX6Lw1taPXDDR8rUtyQ4sFi3MqBdeUNlkH6ifMnv5CkfbmvtshWCz6NtxQmS/IE+Uy19VptKSlG3QcxUSPRNErjbxJsvB7RMSNZIDC7jK5mrdD6NpCd1OL78oyO+ST8aw9qfVV51TqiVfLzLMmbLcCnVlOB0wAB0AAAAHbFJmRlPRqP2MJSbfwxvNykvKEcXhBKUjmICWR0A6k5AA77UQeG9yYnas1gl5ifFuNznB5tqSyEeGG2wlCMhR3wnOPQ1jrS2ttQWC3T7RAuhat0s80iKpKSl1WMcxGM5xtsRWtfZvtzj1ghapcuMlxN2SX0w1LUpDaxlClkqJKlYTgHsK6009nQ9rREe2l4UzhdpuQnou6FQ9MsqyPkayQppAJI2wN61B7ZEsx9EWW2HtfXltj7BZJ/Ak1lxxeWVq8yBVOH4CcnyC17LGmhqTjDay62FxbWlVwfyNiUYCAfitSfurbeppjMWwzZEjm8FDCubCConI5eg69az17C9jKNO6h1M4jaTKRBZV5pbTzLx6cyx91aQK0gLWsjlCSVE+QzmkZa5UOhakpyNb6PtlnTBZfWywwz4LaUxFhGw5QAANhmpLSdw0+w0dNWZ5kOWpoNusNtFKWyOuNsHc5286C134o3uZql+TATMFtdW34MQvp+oCAVc2DjmKdgP4ienU5Wi4GZp6PdJEAQXnmedxopwUYztkgHHcZpfKH8R14bxpclokWXkrV+1Sn4mlZcaNOiuw5ZbkMuoKVtncKB7VXNLT25zJWC0o4yCrG3rVhjvxSFpTIaPL9fBrBYA+ImlnNNXcIb5lwZGVR3DvjzQT5j8RvQL47XVLVsiWltX05DniuD7Ken4kfdW0uI7Nol6MuDlzeSzGjMqfS+U48NSRsRnrvtjvmvnTri9qv+pJM/J8HPhsjyQOn37n51T40brl+Cc1aWiG5FeVaT9l7iLyxTpS4OJExlP+TcJ3dbG3LnupI2+GPKs2Fwkds75NLQ5smHKalxHlsSGnA424g4KVDoRVuSFc6ZPNOXtBE9rm9yLnxgeiOKV4VuhMMNpPYqT4ij8yv8KE0JLjkgFISSN96vGrm53ES4q1HDUhy7lltFxidD+rSEB9v+JBAHMOqT5g5qOb0NqWOtLjUEOhXQBwJUPUg4IFec5cPiynfJbRFyV5cUt2KFpAwHMZFb84EQZ9s0Xp623NxLkmNa0lzlIITzHKUgjrhJAzWVuDfCifedZR3b+w2m0MuczzBe5vGOCQkcvQZ67+lbK0qoCdcVjAS0hDaQBgAAdKyq30FE67M4+2zOAuGm7dz8ykpkyVfMpQn8jWeP3G0dSdzRX9ru4+/cXlwkqymBBYY+ClZcV/9xQsb2UTjYDANU4lqUKv2bk9jxhDXACzLAwp6VMdPqS+of8AaKKjjKJUN+O7nkeQpteDg8qgQfwNDX2SkhPs+aaJ7iSr75DlEtCiljmzg5NSV7KF6MtsaV1JZNRL0C5BcfkSJPPDlch8J1vGEvc3YJTkqGdiMVpO5s+7WFURKi54cTwwSN1YRyjb1qSClFe6zyio+8PoZt0qa7gNsMrdOfIDalRjUb0UZ/IrMlv6AloS8vWlpq1TStxSMNNkdevQ+gHf0ozwG+Zpt1llTrawClQ2GfPl65+NCPhjZ37pqAXFbCHY7KyVc++XDuAB1J3z91NvaJ40W/Rtve07pZ1K768kodcRjEYHY7jqr8vydEO3pE1UpW2U72wuKiJCRoKySlOJQQbi6COo6NgjsP77Vl+lJL70mQ5IkOKddcUVLWo5Kie9J16cQonSIqp09nV1dXUZgrDkyIUtqXEfcYkNKC23G1YUk+YNE7S+uYNzKWL0puBPP/mMYYePmr/01H+k+lCyuoLibWmbNOXtGzuDUdaVOOrT9Z36PcEBHUEdRv1ooabS4WJriFcviSQk/DptWBdGa51RpGQl2yXR1lCTnwVnmbP8p6fLFHDQ/tNIiQ1xL/YiFrVze8RlZAVjqU9cZxUV+LS+PZTOdfYHOLtzN74raoupWC0u5vIbx3Sg8g/BNV5KypJCQcedPXLZLlzHJEW8WOYXFlZHvHhKJJyfouBJ6mnK9PX59khNuc5sf6S0LSfgQo06ZaWhTezbXspDHs9aVUc7sPn/AOQ5RIQf8oD60HfZ81bpnS3A7Tlp1Be4Ntnxo7qX477mHGyXnCAQPQg/OnWoePvDa0xeRu9++upz+rjtk5+dSfzpvpFHKUvYVHnEoZw4tLaTutRPby+JqocWLrHh6SlQ1SWY7kgoS6pxfKltBIOCfgN6zFrH2i7/ADri6/annGm8nwW0NJbS2Ox5lZWT6jloRam1Zf8AUbql3W4vPIUoq8PnPLknJJyck+pJp8eM37F1mX0GXXXG9i0WRemtAApcWnEu6K+steMK8PyT5f2KAUl96S+t+Q6t11xXMtazkqPma8V1VxChaRPVOntnV1dXUZh//9k=";

Object.assign(TEAMS.svetunited, {
  name: "Trablos United",
  logo: "/sister-cities/assets/trablos-united-2026.jpg"
});

Object.assign(TEAMS.daddytate, {
  name: "Spidey",
  logo: "/sister-cities/assets/spidey-logo-v3.jpg"
});

Object.assign(TEAMS.miami, {
  name: "Buy the Dip-hins",
  logo: "/sister-cities/assets/buy-the-diphins-2026.jpg"
});

Object.assign(TEAMS.snorlax, {
  logo: "/sister-cities/assets/snorlax.jpg"
});

Object.assign(TEAMS.maleksexcornflex, {
  name: "Invincibles",
  logo: "/sister-cities/assets/invincibles-logo-2026-final.webp"
});

Object.assign(TEAMS.drhtown, {
  logo: DRHTOWN_LOGO_2026
});

// =====================
// 2026 FRANCHISE HUB ORDER
// Active franchises stay forward; inactive franchises move to the end.
// Team IDs remain unchanged, so each franchise keeps its full profile/stats.
// =====================

FRANCHISE_RANDOM_ORDER.splice(
  0,
  FRANCHISE_RANDOM_ORDER.length,
  "sixowls",
  "miami",
  "drhtown",
  "barjalona",
  "svetunited",
  "angolarookie",
  "daddytate",
  "maleksexcornflex",
  "snorlax",
  "arshamaa",
  "abethe3arab"
);

(function refreshTeamIdentityUI() {
  // Re-render all-time records so historical record holders use current identities.
  renderAllTime(computeAllTime(seasons));

  // Re-render the currently selected season using the updated identities.
  const activeYearButton = document.querySelector(".season-year-button.active");
  const currentYear = activeYearButton ? Number(activeYearButton.dataset.season) : 2025;
  const season = seasons[currentYear];

  if (season) {
    renderChampion(season);

    const standingsEl = document.getElementById("seasonStandings");
    const statsEl = document.getElementById("seasonStats");

    if (standingsEl) standingsEl.innerHTML = renderStandings(season);
    if (statsEl) statsEl.innerHTML = renderStats(season);
  }

  // Rebuild Franchise Hub with the current names, logos, and 2026 board order.
  buildFranchiseGrid();
})();
