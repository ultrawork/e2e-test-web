package com.ultrawork.notes

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextClearance
import androidx.compose.ui.test.performTextInput
import org.junit.Rule
import org.junit.Test

class NotesSearchE2ETest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    // SC-008 equivalent: Display list of notes on launch
    @Test
    fun testNotesListDisplayedOnLaunch() {
        composeTestRule.onNodeWithTag("notes_search_field").assertIsDisplayed()
        composeTestRule.onNodeWithText("Покупки", substring = false).assertIsDisplayed()
        composeTestRule.onNodeWithText("Рабочие задачи", substring = false).assertIsDisplayed()
        composeTestRule.onNodeWithText("Идеи для проекта", substring = false).assertIsDisplayed()
    }

    // SC-009 equivalent: Search notes by title — successful filtering
    @Test
    fun testSearchNotesFiltersCorrectly() {
        val searchField = composeTestRule.onNodeWithTag("notes_search_field")
        searchField.assertIsDisplayed()

        // Exact match
        searchField.performTextInput("Покупки")
        composeTestRule.onNodeWithText("Покупки").assertIsDisplayed()
        composeTestRule.onNodeWithText("Рабочие задачи").assertDoesNotExist()

        // Clear and test case-insensitive
        searchField.performTextClearance()
        searchField.performTextInput("покупки")
        composeTestRule.onNodeWithText("Покупки").assertIsDisplayed()

        // Clear and test partial match
        searchField.performTextClearance()
        searchField.performTextInput("для")
        composeTestRule.onNodeWithText("Идеи для проекта").assertIsDisplayed()
        composeTestRule.onNodeWithText("Покупки").assertDoesNotExist()
    }

    // SC-010 equivalent: Search notes — no results
    @Test
    fun testSearchNoResults() {
        val searchField = composeTestRule.onNodeWithTag("notes_search_field")
        searchField.performTextInput("Несуществующая заметка")

        composeTestRule.onNodeWithText("Покупки").assertDoesNotExist()
        composeTestRule.onNodeWithText("Заметки не найдены").assertIsDisplayed()
    }

    // SC-011 equivalent: Clear search — restore full list
    @Test
    fun testClearSearchRestoresFullList() {
        val searchField = composeTestRule.onNodeWithTag("notes_search_field")
        searchField.performTextInput("Покупки")
        composeTestRule.onNodeWithText("Покупки").assertIsDisplayed()

        searchField.performTextClearance()
        composeTestRule.onNodeWithText("Покупки").assertIsDisplayed()
        composeTestRule.onNodeWithText("Идеи для проекта").assertIsDisplayed()
    }
}
