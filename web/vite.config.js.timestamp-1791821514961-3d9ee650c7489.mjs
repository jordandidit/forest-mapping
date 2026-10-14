// vite.config.js
import { defineConfig, loadEnv } from "file:///D:/jado/Rwanda%20Forest%20Health%20Monitor%20V2%20(nightly)/web/node_modules/vite/dist/node/index.js";
import react from "file:///D:/jado/Rwanda%20Forest%20Health%20Monitor%20V2%20(nightly)/web/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///D:/jado/Rwanda%20Forest%20Health%20Monitor%20V2%20(nightly)/web/node_modules/@tailwindcss/vite/dist/index.mjs";
var DEV_BASE = "/forestmonitoring/";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const APP_BASE = env.VITE_BASE_PATH || (mode === "production" ? "/" : DEV_BASE);
  return {
    base: APP_BASE,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "redirect-root-to-app",
        configureServer(server) {
          if (APP_BASE === "/" || APP_BASE === "") return;
          server.middlewares.use((req, res, next) => {
            const url = req.url || "";
            if (url === "/" || url === "") {
              res.statusCode = 302;
              res.setHeader("Location", APP_BASE);
              res.end();
              return;
            }
            next();
          });
        }
      }
    ],
    server: {
      port: 5173,
      proxy: {
        "/forestmonitoring/api": {
          target: "http://localhost:8787",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/forestmonitoring/, "")
        },
        "/api": {
          target: "http://localhost:8787",
          changeOrigin: true
        }
      }
    },
    preview: {
      port: 4173,
      proxy: {
        "/api": {
          target: "http://localhost:8787",
          changeOrigin: true
        }
      }
    },
    optimizeDeps: {
      exclude: ["@arcgis/core"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxqYWRvXFxcXFJ3YW5kYSBGb3Jlc3QgSGVhbHRoIE1vbml0b3IgVjIgKG5pZ2h0bHkpXFxcXHdlYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcamFkb1xcXFxSd2FuZGEgRm9yZXN0IEhlYWx0aCBNb25pdG9yIFYyIChuaWdodGx5KVxcXFx3ZWJcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2phZG8vUndhbmRhJTIwRm9yZXN0JTIwSGVhbHRoJTIwTW9uaXRvciUyMFYyJTIwKG5pZ2h0bHkpL3dlYi92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXG5cbmNvbnN0IERFVl9CQVNFID0gJy9mb3Jlc3Rtb25pdG9yaW5nLydcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKVxuICAvLyBQcm9kdWN0aW9uIChWZXJjZWwgLyBucG0gcnVuIGJ1aWxkKSBzZXJ2ZXMgYXQgZG9tYWluIHJvb3QuXG4gIC8vIExvY2FsIGB2aXRlYCBrZWVwcyAvZm9yZXN0bW9uaXRvcmluZyBmb3IgbG9jYWwgcGF0aCBwcmVmZXJlbmNlLlxuICBjb25zdCBBUFBfQkFTRSA9IGVudi5WSVRFX0JBU0VfUEFUSCB8fCAobW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gJy8nIDogREVWX0JBU0UpXG5cbiAgcmV0dXJuIHtcbiAgICBiYXNlOiBBUFBfQkFTRSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgdGFpbHdpbmRjc3MoKSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ3JlZGlyZWN0LXJvb3QtdG8tYXBwJyxcbiAgICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICAgIGlmIChBUFBfQkFTRSA9PT0gJy8nIHx8IEFQUF9CQVNFID09PSAnJykgcmV0dXJuXG4gICAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgfHwgJydcbiAgICAgICAgICAgIGlmICh1cmwgPT09ICcvJyB8fCB1cmwgPT09ICcnKSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMzAyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0xvY2F0aW9uJywgQVBQX0JBU0UpXG4gICAgICAgICAgICAgIHJlcy5lbmQoKVxuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0OiA1MTczLFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgJy9mb3Jlc3Rtb25pdG9yaW5nL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0Ojg3ODcnLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvZm9yZXN0bW9uaXRvcmluZy8sICcnKSxcbiAgICAgICAgfSxcbiAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4Nzg3JyxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgcHJldmlldzoge1xuICAgICAgcG9ydDogNDE3MyxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICcvYXBpJzoge1xuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODc4NycsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgZXhjbHVkZTogWydAYXJjZ2lzL2NvcmUnXSxcbiAgICB9LFxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtVyxTQUFTLGNBQWMsZUFBZTtBQUN6WSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFFeEIsSUFBTSxXQUFXO0FBRWpCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUczQyxRQUFNLFdBQVcsSUFBSSxtQkFBbUIsU0FBUyxlQUFlLE1BQU07QUFFdEUsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1o7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLGdCQUFnQixRQUFRO0FBQ3RCLGNBQUksYUFBYSxPQUFPLGFBQWEsR0FBSTtBQUN6QyxpQkFBTyxZQUFZLElBQUksQ0FBQyxLQUFLLEtBQUssU0FBUztBQUN6QyxrQkFBTSxNQUFNLElBQUksT0FBTztBQUN2QixnQkFBSSxRQUFRLE9BQU8sUUFBUSxJQUFJO0FBQzdCLGtCQUFJLGFBQWE7QUFDakIsa0JBQUksVUFBVSxZQUFZLFFBQVE7QUFDbEMsa0JBQUksSUFBSTtBQUNSO0FBQUEsWUFDRjtBQUNBLGlCQUFLO0FBQUEsVUFDUCxDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDTCx5QkFBeUI7QUFBQSxVQUN2QixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsdUJBQXVCLEVBQUU7QUFBQSxRQUMzRDtBQUFBLFFBQ0EsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxRQUNoQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWixTQUFTLENBQUMsY0FBYztBQUFBLElBQzFCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
