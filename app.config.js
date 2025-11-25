// app.config.js
module.exports = ({ config }) => {
  // Return the entire object that was previously in app.json
  return {
    "expo": {
      "name": "SipSpot",
      "slug": "SipSpot",
      "version": "1.0.0",
      "orientation": "portrait",
      "icon": "./assets/images/coffee_bean.png",
      "scheme": "SipSpot",
      "userInterfaceStyle": "automatic",
      "newArchEnabled": true,
      "ios": {
        "supportsTablet": true
      },
      "android": {
        "adaptiveIcon": {
          "backgroundColor": "#E6F4FE",
          "foregroundImage": "./assets/images/coffee_bean.png",
          "backgroundImage": "./assets/images/coffee_bean.png",
          "monochromeImage": "./assets/images/coffee_bean.png"
        },
        "edgeToEdgeEnabled": true,
        "predictiveBackGestureEnabled": false,
        "package": "com.iuli338.SipSpot",
        "config": {
          "googleMaps": {
            // THIS LINE IS NOW VALID JAVASCRIPT
            "apiKey": process.env.GOOGLE_MAPS_KEY_ANDROID,
          }
        }
      },
      "web": {
        "output": "single",
        "favicon": "./assets/images/favicon.png"
      },
      "plugins": [
        [
          "expo-splash-screen",
          {
            "image": "./assets/images/splash-icon.png",
            "imageWidth": 200,
            "resizeMode": "contain",
            "backgroundColor": "#ffffff",
            "dark": {
              "backgroundColor": "#000000"
            }
          }
        ]
      ],
      "experiments": {
        "typedRoutes": true,
        "reactCompiler": true
      },
      "extra": {
        "eas": {
          "projectId": "80187e4f-c1f6-42b2-aa5f-dd5a63f7a460"
        }
      }
    }
  }
};