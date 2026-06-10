export const advisorByOwner = {
  ali: {
    owner: "ali",
    advisor: "Ali",
    name: "Ali Taghavi",
    firstName: "Ali",
    phoneNumber: "971522950316"
  }
};

export function normalizeAdvisorOwner() {
  return "ali";
}

export function advisorForOwner() {
  return advisorByOwner.ali;
}
