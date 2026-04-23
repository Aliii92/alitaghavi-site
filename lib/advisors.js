export const advisorByOwner = {
  ali: {
    owner: "ali",
    advisor: "Ali",
    name: "Ali Taghavi",
    firstName: "Ali",
    phoneNumber: "971522950316"
  },
  negin: {
    owner: "negin",
    advisor: "Negin",
    name: "Negin Mohamadi",
    firstName: "Negin",
    phoneNumber: "971505996547"
  }
};

export function normalizeAdvisorOwner(owner, fallbackOwner = "ali") {
  if (owner === "negin" || owner === "ali") return owner;
  return fallbackOwner === "negin" ? "negin" : "ali";
}

export function advisorForOwner(owner, fallbackOwner = "ali") {
  return advisorByOwner[normalizeAdvisorOwner(owner, fallbackOwner)] || advisorByOwner.ali;
}
