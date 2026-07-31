import { useMemo, useState } from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MobileContext } from "./MobileContext.js";
import { createMobileApi } from "../services/mobileApi.js";
import { ConnectionScreen } from "../screens/ServerConnectionScreen.js";
import { EncounterSetupScreen } from "../screens/EncounterSetupScreen.js";
import { CombatScreen } from "../screens/CombatScreen.js";
import { colors } from "../theme/colors.js";

const Stack = createNativeStackNavigator();
const navigationTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.cyan } };

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(null);
  const service = useMemo(() => apiBaseUrl ? createMobileApi(apiBaseUrl) : null, [apiBaseUrl]);
  const context = useMemo(() => ({ apiBaseUrl, setApiBaseUrl, service }), [apiBaseUrl, service]);
  return (
    <SafeAreaProvider>
      <MobileContext.Provider value={context}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator initialRouteName="Connection" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Connection" component={ConnectionScreen} />
            <Stack.Screen name="Setup" component={EncounterSetupScreen} />
            <Stack.Screen name="Combat" component={CombatScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </MobileContext.Provider>
    </SafeAreaProvider>
  );
}
