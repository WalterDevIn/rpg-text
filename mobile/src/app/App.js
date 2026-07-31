import { useEffect, useMemo, useState } from "react";
import { useFonts } from "expo-font";
import { SpaceMono_400Regular, SpaceMono_700Bold } from "@expo-google-fonts/space-mono";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MobileContext } from "./MobileContext.js";
import { createMobileApi } from "../services/mobileApi.js";
import { ConnectionScreen } from "../screens/ServerConnectionScreen.js";
import { HomeScreen } from "../screens/HomeScreen.js";
import { ParticipantsScreen, AddParticipantsScreen, ScenarioScreen, RulesScreen, ReviewScreen } from "../screens/EncounterSetupScreens.js";
import { CreationHubScreen } from "../screens/CreationHubScreen.js";
import { SettingsScreen } from "../screens/SettingsScreen.js";
import { CombatScreen } from "../screens/CombatScreen.js";
import { colors } from "../theme/colors.js";
import { screens } from "../navigation/navigation.js";
import { loadEncounterDraft, saveEncounterDraft } from "../storage/serverStorage.js";
import { createEncounterDraft } from "../state/encounterDraft.js";
import { LoadingState } from "../components/LoadingState.js";

const Stack = createNativeStackNavigator();
const navigationTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.cyan } };

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ SpaceMono: SpaceMono_400Regular, SpaceMonoBold: SpaceMono_700Bold });
  const [apiBaseUrl, setApiBaseUrl] = useState(null);
  const [draft, setDraft] = useState(createEncounterDraft());
  const service = useMemo(() => apiBaseUrl ? createMobileApi(apiBaseUrl) : null, [apiBaseUrl]);
  useEffect(() => { loadEncounterDraft().then((saved) => saved && setDraft(createEncounterDraft(saved))).catch(() => {}); }, []);
  useEffect(() => { saveEncounterDraft(draft).catch(() => {}); }, [draft]);
  const context = useMemo(() => ({ apiBaseUrl, setApiBaseUrl, service, draft, setDraft }), [apiBaseUrl, service, draft]);
  if (!fontsLoaded && !fontError) return <LoadingState label="Loading interface" />;
  return (
    <SafeAreaProvider>
      <MobileContext.Provider value={context}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator initialRouteName={screens.CONNECTION} screenOptions={{ headerShown: false }}>
            <Stack.Screen name={screens.CONNECTION} component={ConnectionScreen} />
            <Stack.Screen name={screens.HOME} component={HomeScreen} />
            <Stack.Screen name={screens.PARTICIPANTS} component={ParticipantsScreen} />
            <Stack.Screen name={screens.ADD_PARTICIPANTS} component={AddParticipantsScreen} />
            <Stack.Screen name={screens.SCENARIO} component={ScenarioScreen} />
            <Stack.Screen name={screens.RULES} component={RulesScreen} />
            <Stack.Screen name={screens.REVIEW} component={ReviewScreen} />
            <Stack.Screen name={screens.COMBAT} component={CombatScreen} />
            <Stack.Screen name={screens.CREATION} component={CreationHubScreen} />
            <Stack.Screen name={screens.SETTINGS} component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </MobileContext.Provider>
    </SafeAreaProvider>
  );
}
