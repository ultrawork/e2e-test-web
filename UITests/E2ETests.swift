import XCTest

final class E2ETests: XCTestCase {
    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
    }

    // SC-008: Display list of notes on launch
    func testSC008_notesListDisplayedOnLaunch() throws {
        let navTitle = app.navigationBars["Notes"]
        XCTAssertTrue(navTitle.waitForExistence(timeout: 5), "Navigation title 'Notes' should be visible")

        let notesList = app.collectionViews.firstMatch
        XCTAssertTrue(notesList.waitForExistence(timeout: 5), "Notes list should be visible")

        XCTAssertTrue(app.staticTexts["Покупки"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Рабочие задачи"].exists)
        XCTAssertTrue(app.staticTexts["Идеи для проекта"].exists)
        XCTAssertTrue(app.staticTexts["Книги для чтения"].exists)
        XCTAssertTrue(app.staticTexts["Заметки с встречи"].exists)
    }

    // SC-009: Search notes by title — successful filtering
    func testSC009_searchNotesFiltersCorrectly() throws {
        let navTitle = app.navigationBars["Notes"]
        XCTAssertTrue(navTitle.waitForExistence(timeout: 5))

        // Swipe down to reveal search field
        let list = app.collectionViews.firstMatch
        XCTAssertTrue(list.waitForExistence(timeout: 5))
        list.swipeDown()

        let searchField = app.searchFields.firstMatch
        XCTAssertTrue(searchField.waitForExistence(timeout: 5), "Search field should be visible")

        // Exact match
        searchField.tap()
        searchField.typeText("Покупки")
        XCTAssertTrue(app.staticTexts["Покупки"].waitForExistence(timeout: 5))
        // Other notes should not be visible
        XCTAssertFalse(app.staticTexts["Рабочие задачи"].exists)

        // Clear and test case-insensitive
        searchField.buttons["Clear text"].tap()
        searchField.typeText("покупки")
        XCTAssertTrue(app.staticTexts["Покупки"].waitForExistence(timeout: 5))

        // Clear and test partial match
        searchField.buttons["Clear text"].tap()
        searchField.typeText("для")
        XCTAssertTrue(app.staticTexts["Идеи для проекта"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Книги для чтения"].exists)
        XCTAssertFalse(app.staticTexts["Покупки"].exists)
    }

    // SC-010: Search notes — no results
    func testSC010_searchNoResults() throws {
        let navTitle = app.navigationBars["Notes"]
        XCTAssertTrue(navTitle.waitForExistence(timeout: 5))

        let list = app.collectionViews.firstMatch
        XCTAssertTrue(list.waitForExistence(timeout: 5))
        list.swipeDown()

        let searchField = app.searchFields.firstMatch
        XCTAssertTrue(searchField.waitForExistence(timeout: 5))
        searchField.tap()
        searchField.typeText("Несуществующая заметка")

        // Verify no notes are displayed
        XCTAssertFalse(app.staticTexts["Покупки"].exists)
        XCTAssertFalse(app.staticTexts["Рабочие задачи"].exists)

        // ContentUnavailableView should show "No Results"
        XCTAssertTrue(app.staticTexts["No Results"].waitForExistence(timeout: 5))
    }

    // SC-011: Clear search — restore full list
    func testSC011_clearSearchRestoresFullList() throws {
        let navTitle = app.navigationBars["Notes"]
        XCTAssertTrue(navTitle.waitForExistence(timeout: 5))

        let list = app.collectionViews.firstMatch
        XCTAssertTrue(list.waitForExistence(timeout: 5))
        list.swipeDown()

        let searchField = app.searchFields.firstMatch
        XCTAssertTrue(searchField.waitForExistence(timeout: 5))
        searchField.tap()
        searchField.typeText("Покупки")

        XCTAssertTrue(app.staticTexts["Покупки"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["Рабочие задачи"].exists)

        // Clear search
        searchField.buttons["Clear text"].tap()

        // All notes should be restored
        XCTAssertTrue(app.staticTexts["Покупки"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Рабочие задачи"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Идеи для проекта"].exists)
        XCTAssertTrue(app.staticTexts["Книги для чтения"].exists)
        XCTAssertTrue(app.staticTexts["Заметки с встречи"].exists)
    }
}
