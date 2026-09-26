// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AttendanceOS
 * @notice Onchain attendance tracking for InstoPay.
 *         Multi-tenant: every wallet is its own "company".
 *         Each record = (company, employeeWallet, year, month, day) → status.
 *
 * Status codes (uint8):
 *   0 = Belum diisi (not recorded)
 *   1 = Hadir  (present)
 *   2 = Cuti   (paid leave)
 *   3 = Izin   (permitted absence)
 *   4 = Tidak Masuk (absent / unpaid)
 *
 * Working-days setting: each company stores their standard working days per
 * month (default 26). Used by frontend to calculate proportional salary.
 */
contract AttendanceOS {

    // ── Types ────────────────────────────────────────────────────────────────

    uint8 public constant STATUS_NONE    = 0;
    uint8 public constant STATUS_HADIR   = 1;
    uint8 public constant STATUS_CUTI    = 2;
    uint8 public constant STATUS_IZIN    = 3;
    uint8 public constant STATUS_ABSEN   = 4;

    // ── Storage ──────────────────────────────────────────────────────────────

    /// company → employee → year → month → day → status
    mapping(address => mapping(address => mapping(uint16 => mapping(uint8 => mapping(uint8 => uint8))))) private _attendance;

    /// company → standard working days per month (0 = use default 26)
    mapping(address => uint8) private _workingDays;

    // ── Events ───────────────────────────────────────────────────────────────

    event AttendanceSet(
        address indexed company,
        address indexed employee,
        uint16 year,
        uint8  month,
        uint8  day,
        uint8  status
    );

    event WorkingDaysSet(address indexed company, uint8 workingDays);

    // ── Errors ───────────────────────────────────────────────────────────────

    error InvalidStatus();
    error InvalidDate();
    error InvalidWorkingDays();
    error ArrayLengthMismatch();

    // ── Setters ──────────────────────────────────────────────────────────────

    /**
     * @notice Mark attendance for a single employee on a single day.
     */
    function setAttendance(
        address employee,
        uint16  year,
        uint8   month,
        uint8   day,
        uint8   status
    ) external {
        if (status > STATUS_ABSEN) revert InvalidStatus();
        if (month < 1 || month > 12) revert InvalidDate();
        if (day < 1 || day > 31) revert InvalidDate();

        _attendance[msg.sender][employee][year][month][day] = status;
        emit AttendanceSet(msg.sender, employee, year, month, day, status);
    }

    /**
     * @notice Batch-set attendance for multiple days at once.
     *         days[i] corresponds to statuses[i].
     */
    function setAttendanceBatch(
        address   employee,
        uint16    year,
        uint8     month,
        uint8[]   calldata dayList,
        uint8[]   calldata statusList
    ) external {
        if (dayList.length != statusList.length) revert ArrayLengthMismatch();
        if (month < 1 || month > 12) revert InvalidDate();

        for (uint256 i = 0; i < dayList.length; i++) {
            uint8 d = dayList[i];
            uint8 s = statusList[i];
            if (d < 1 || d > 31) revert InvalidDate();
            if (s > STATUS_ABSEN) revert InvalidStatus();
            _attendance[msg.sender][employee][year][month][d] = s;
            emit AttendanceSet(msg.sender, employee, year, month, d, s);
        }
    }

    /**
     * @notice Set the standard working days per month for the caller's company.
     *         Valid range: 1–31. Pass 0 to reset to default (26).
     */
    function setWorkingDays(uint8 workingDays) external {
        if (workingDays > 31) revert InvalidWorkingDays();
        _workingDays[msg.sender] = workingDays;
        emit WorkingDaysSet(msg.sender, workingDays);
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    /**
     * @notice Get a single attendance record.
     *         Returns STATUS_NONE (0) if not set.
     */
    function getAttendance(
        address company,
        address employee,
        uint16  year,
        uint8   month,
        uint8   day
    ) external view returns (uint8) {
        return _attendance[company][employee][year][month][day];
    }

    /**
     * @notice Get attendance for all days (1–31) of a given month.
     *         Returns an array of 31 uint8 values (index 0 = day 1 ... index 30 = day 31).
     */
    function getMonthAttendance(
        address company,
        address employee,
        uint16  year,
        uint8   month
    ) external view returns (uint8[31] memory) {
        uint8[31] memory result;
        mapping(uint8 => uint8) storage dayMap = _attendance[company][employee][year][month];
        for (uint8 d = 1; d <= 31; d++) {
            result[d - 1] = dayMap[d];
        }
        return result;
    }

    /**
     * @notice Get attendance summary for an employee in a given month.
     *         Returns (hadir, cuti, izin, absen) counts.
     */
    function getMonthSummary(
        address company,
        address employee,
        uint16  year,
        uint8   month
    ) external view returns (uint16 hadir, uint16 cuti, uint16 izin, uint16 absen) {
        mapping(uint8 => uint8) storage dayMap = _attendance[company][employee][year][month];
        for (uint8 d = 1; d <= 31; d++) {
            uint8 s = dayMap[d];
            if (s == STATUS_HADIR)      hadir++;
            else if (s == STATUS_CUTI)  cuti++;
            else if (s == STATUS_IZIN)  izin++;
            else if (s == STATUS_ABSEN) absen++;
        }
    }

    /**
     * @notice Get the standard working days for a company.
     *         Returns 26 if not set.
     */
    function getWorkingDays(address company) external view returns (uint8) {
        uint8 wd = _workingDays[company];
        return wd == 0 ? 26 : wd;
    }
}
