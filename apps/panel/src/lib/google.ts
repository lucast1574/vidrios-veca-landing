export type GoogleConfiguration = {
  projectId: string;
  apiKey: string;
  authDomain: string;
  appId: string;
};
export async function googleIdToken(
  configuration: GoogleConfiguration,
  email?: string | null,
) {
  const [
    { initializeApp, getApps },
    {
      getAuth,
      GoogleAuthProvider,
      signInWithPopup,
      inMemoryPersistence,
      setPersistence,
      signOut,
    },
  ] = await Promise.all([import("@firebase/app"), import("@firebase/auth")]);
  const app =
    getApps().find((app) => app.name === "veca-panel") ||
    initializeApp(configuration, "veca-panel");
  const auth = getAuth(app);
  await setPersistence(auth, inMemoryPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
    ...(email ? { login_hint: email } : {}),
  });
  const result = await signInWithPopup(auth, provider);
  try {
    return await result.user.getIdToken();
  } finally {
    await signOut(auth);
  }
}
