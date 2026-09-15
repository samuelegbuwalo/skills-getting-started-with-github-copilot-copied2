from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


client = TestClient(app)
original_activities = deepcopy(activities)


@pytest.fixture(autouse=True)
def restore_activities():
    activities.clear()
    activities.update(deepcopy(original_activities))
    yield
    activities.clear()
    activities.update(deepcopy(original_activities))


def test_get_activities_returns_all_activities():
    # Arrange
    expected_names = set(original_activities)

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert set(response.json()) == expected_names


def test_signup_adds_student_to_activity():
    # Arrange
    email = "new.student@mergington.edu"
    activity_name = "Chess Club"

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup", params={"email": email}
    )

    # Assert
    assert response.status_code == 200
    assert email in activities[activity_name]["participants"]


def test_signup_rejects_duplicate_student():
    # Arrange
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup", params={"email": email}
    )

    # Assert
    assert response.status_code == 400
    assert response.json() == {"detail": "Student is already signed up"}


def test_signup_rejects_unknown_activity():
    # Arrange
    unknown_activity = "Unknown Club"

    # Act
    response = client.post(
        f"/activities/{unknown_activity}/signup",
        params={"email": "new.student@mergington.edu"},
    )

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_unregister_removes_student_from_activity():
    # Arrange
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]

    # Act
    response = client.delete(
        f"/activities/{activity_name}/unregister", params={"email": email}
    )

    # Assert
    assert response.status_code == 200
    assert email not in activities[activity_name]["participants"]


def test_unregister_rejects_student_not_signed_up():
    # Arrange
    activity_name = "Chess Club"
    email = "not.signed.up@mergington.edu"

    # Act
    response = client.delete(
        f"/activities/{activity_name}/unregister", params={"email": email}
    )

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Student is not signed up"}