const sendWorkItem = async (patient) => {
  var { id, gender } = patient;

  const birthisoDateStr = "2023-02-17T08:54:57.706Z";
  const birthdateObj = new Date(birthisoDateStr);
  const birthyear = birthdateObj.getFullYear().toString();
  const birthmonth = (birthdateObj.getMonth() + 1).toString().padStart(2, "0");
  const birthdate = birthdateObj.getDate().toString().padStart(2, "0");
  var birthDate = birthyear + birthmonth + birthdate;

  const now = new Date();
  const nowyear = now.getFullYear();
  const nowmonth = String(now.getMonth() + 1).padStart(2, "0");
  const nowday = String(now.getDate()).padStart(2, "0");
  const nowhours = String(now.getHours()).padStart(2, "0");
  const nowminutes = String(now.getMinutes()).padStart(2, "0");
  const nowseconds = String(now.getSeconds()).padStart(2, "0");
  const formattedDate = `${nowyear}${nowmonth}${nowday}${nowhours}${nowminutes}${nowseconds}`;

  var DicomTagData = [
    {
      "00100010": {
        vr: "PN",
        Value: [
          {
            Alphabetic: id,
          },
        ],
      },
      "00100020": {
        vr: "LO",
        Value: [id],
      },
      "00100040": {
        vr: "CS",
        Value: [gender.toUpperCase()],
      },
      "00100030": {
        vr: "DA",
        Value: [birthDate],
      },
      "00404005": {
        vr: "DT",
        Value: [formattedDate],
      },
      "00404010": {
        vr: "DT",
        Value: [formattedDate],
      },
      "00404041": {
        vr: "CS",
        Value: ["READY"],
      },
      "00741000": {
        vr: "CS",
        Value: ["SCHEDULED"],
      },
      "00741200": {
        vr: "CS",
        Value: ["MEDIUM"],
      },
      "00741202": {
        vr: "LO",
        Value: ["WORKLIST"],
      },
      "00741204": {
        vr: "LO",
        Value: ["Scheduled procedure step description"],
      },
    },
  ];
  return DicomTagData;
};

module.exports = { sendWorkItem };
