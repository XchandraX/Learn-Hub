import { loadScript } from "../utils.js";

let _fengariLoaded = false;

export const initFengari = async () => {
  if (_fengariLoaded) return;
  await loadScript("https://cdn.jsdelivr.net/npm/fengari@0.1.4/src/fengari.js");
  await loadScript("https://cdn.jsdelivr.net/npm/fengari@0.1.4/src/fengari-web.js");
  _fengariLoaded = true;
};

export const runLua = async (code) => {
  const panel = document.getElementById("output-panel");
  const out = document.getElementById("output-content");
  panel.style.display = "flex";

  let buffer = "▶ Menjalankan Lua...\n\n";
  out.textContent = buffer;

  const write = (s) => {
    buffer += s + "\n";
    out.textContent = buffer;
    out.scrollTop = out.scrollHeight;
  };

  try {
    await initFengari();
    const { lua, lauxlib, lualib, to_luastring, to_jsstring } = window.fengari;

    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);

    lua.lua_pushjsfunction(L, (L) => {
      const n = lua.lua_gettop(L);
      const parts = [];
      for (let i = 1; i <= n; i++) {
        parts.push(to_jsstring(lua.lua_tostring(L, i)) || "");
      }
      write(parts.join("\t"));
      return 0;
    });
    lua.lua_setglobal(L, to_luastring("print"));

    lua.lua_pushjsfunction(L, (L) => {
      const msg = lua.lua_gettop(L) > 0 ? to_jsstring(lua.lua_tostring(L, 1)) : "Input:";
      const val = window.prompt(msg) ?? "";
      lua.lua_pushstring(L, to_luastring(val));
      return 1;
    });
    lua.lua_setglobal(L, to_luastring("input"));

    const status = lauxlib.luaL_dostring(L, to_luastring(code));
    if (status !== lua.LUA_OK) {
      const err = to_jsstring(lua.lua_tostring(L, -1));
      write("❌ " + err);
    }
  } catch (e) {
    write("❌ " + e.message);
  }
};