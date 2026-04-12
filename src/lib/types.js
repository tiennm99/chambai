// Shared JSDoc type definitions for the answer sheet scoring system
// This file is never imported at runtime — only referenced via @type/@param JSDoc tags.

/**
 * @typedef {object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} BoundingBox
 * @property {number} left
 * @property {number} right
 * @property {number} top
 * @property {number} bottom
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {object} MarkerDetectionResult
 * @property {Point[]} corners - Detected corner marker centers (0–4)
 * @property {Point[]} edges - All candidate marker centers
 * @property {BoundingBox} boundingBox - Bounding box of the answer area
 */

/**
 * @typedef {object} Bubble
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} area
 * @property {number} circularity
 * @property {string} section - 'studentId' | 'examCode' | 'section1' | 'section2' | 'section3'
 * @property {number} [column] - Column index (for studentId/examCode grids)
 * @property {number} [row] - Row index / digit value (for studentId/examCode grids)
 * @property {number} [question] - Question number (for answer sections)
 * @property {string} [option] - 'A' | 'B' | 'C' | 'D' (for section1)
 * @property {string} [subOption] - 'a' | 'b' | 'c' | 'd' (for section2)
 * @property {boolean} [value] - true/false bubble (for section2)
 * @property {number} [digit] - Digit value 0–9 (for section3)
 */

/**
 * @typedef {object} TrueFalseAnswer
 * @property {boolean} a
 * @property {boolean} b
 * @property {boolean} c
 * @property {boolean} d
 */

/**
 * @typedef {object} ScoringConfig
 * @property {{ pointsPerQuestion: number }} phanI
 * @property {{ pointsPerQuestion: number, partialCredit: boolean }} phanII
 * @property {{ pointsPerQuestion: number }} phanIII
 */

/**
 * @typedef {object} TestConfig
 * @property {{ questionCount: number, answers: string[] }} phanI
 * @property {{ questionCount: number, answers: TrueFalseAnswer[] }} phanII
 * @property {{ questionCount: number, answers: string[] }} phanIII
 * @property {ScoringConfig} [scoring]
 */

/**
 * @typedef {object} ScoreResult
 * @property {number} phanI
 * @property {number} phanII
 * @property {number} phanIII
 * @property {number} total
 * @property {number} maxTotal
 * @property {number} percentage
 */

/**
 * @typedef {object} ProcessingResult
 * @property {string} studentId
 * @property {string} examCode
 * @property {string[]} phanI
 * @property {TrueFalseAnswer[]} phanII
 * @property {string[]} phanIII
 * @property {number} confidence
 * @property {string} [debugImageUrl]
 */

/**
 * @typedef {object} StudentResult
 * @property {string} id
 * @property {string} fileName
 * @property {string} studentId
 * @property {string} [examCode]
 * @property {string[]} phanI
 * @property {TrueFalseAnswer[]} phanII
 * @property {string[]} phanIII
 * @property {boolean} [processed]
 * @property {string} [debugImageUrl]
 * @property {ScoreResult} [score]
 */

// OpenCV.js Mat type — opaque handle, no structural definition needed
/**
 * @typedef {object} OpenCVMat
 * @property {number} rows
 * @property {number} cols
 * @property {function} delete
 * @property {function} roi
 */

export {};
