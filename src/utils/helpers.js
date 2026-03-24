// src/utils/helpers.js

// --- ດຶງວັນທີ ແລະ ບັງຄັບເຂດເວລາເປັນຂອງປະເທດລາວ (Asia/Vientiane) ຮູບແບບ YYYY-MM-DD ---
export const getLaosDateString = (dateInput) => {
  let d = dateInput ? new Date(dateInput) : new Date();

  if (typeof dateInput === "string" && dateInput.length === 10) {
    d = new Date(`${dateInput}T00:00:00`);
  }

  if (isNaN(d.getTime())) {
    return typeof dateInput === "string" ? dateInput.split("T")[0] : "";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Vientiane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;

  return `${year}-${month}-${day}`;
};

// --- ແຍກພາກສ່ວນວັນທີ YYYY, MM, DD ຕາມເວລາລາວ ---
export const getLaosDateParts = (dateInput) => {
  const dateStr = getLaosDateString(dateInput);
  if (!dateStr) return { yyyy: "", mm: "", dd: "" };
  const [yyyy, mm, dd] = dateStr.split("-");
  return { yyyy, mm, dd };
};

// --- ສ້າງ ID ສຳລັບບັນທຶກການເຕີມນ້ຳມັນ ---
export const generateLogId = (dateStr, allLogs) => {
  const { yyyy, mm, dd } = getLaosDateParts(dateStr);
  if (!yyyy) return Date.now().toString();
  const prefix = `${yyyy}${mm}${dd}`;

  const todaysLogs = allLogs.filter(
    (l) => l.id && String(l.id).startsWith(prefix),
  );
  let maxSeq = 0;
  todaysLogs.forEach((l) => {
    const seq = parseInt(String(l.id).slice(8), 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  });
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
};

// --- ສ້າງ ID ສຳລັບຜູ້ໃຊ້ງານ (Users) ---
export const generateUserId = (allUsers) => {
  const { yyyy, mm } = getLaosDateParts(new Date());
  const prefix = `${yyyy}${mm}`;

  const monthUsers = allUsers.filter(
    (u) => u.id && String(u.id).startsWith(prefix),
  );
  let maxSeq = 0;
  monthUsers.forEach((u) => {
    const seq = parseInt(String(u.id).slice(6), 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  });
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
};

// --- ສ້າງຊື່ໄຟລ໌ຮູບແບບໃໝ່ ---
export const generateImageFilename = (
  type,
  plate,
  dateStr,
  allLogs,
  currentId,
) => {
  const { yyyy, mm, dd } = getLaosDateParts(dateStr);
  const prefixDate = yyyy ? `${yyyy}${mm}${dd}` : "YYYYMMDD";

  const sameDayCarLogs = allLogs.filter(
    (l) =>
      l.date === dateStr &&
      l.licensePlate === plate &&
      String(l.id) !== String(currentId),
  );
  const seq = sameDayCarLogs.length + 1;
  return `${type}_${plate}_${prefixDate}${String(seq).padStart(2, "0")}`;
};

// --- ແປງຮູບແບບວັນທີເປັນ DD/MM/YYYY ສຳລັບສະແດງຜົນ ---
export const formatDateDisplay = (dateInput) => {
  const ymd = getLaosDateString(dateInput);
  if (ymd && typeof ymd === "string" && ymd.includes("-")) {
    const parts = ymd.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateInput;
};

// --- ແປງຕົວເລກເປັນຮູບແບບ XXX,XXX.XX (ສຳລັບລິດ, ອັດຕາສິ້ນເປືອງ) ---
export const formatNumber = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// --- ແປງຕົວເລກເປັນຮູບແບບ XXX,XXX ບໍ່ມີຈຸດທົດສະນິຍົມ (ສຳລັບເງິນ, ເລກກິໂລ) ---
export const formatInteger = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
};
