export const getAppUrl = () => {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL not found");
  }

  return appUrl.replace(/\/+$/, "");
};
