from flask.ext.login import current_user

from account import logged_in


def create():
    return logged_in()


def read(dataset):
	#use this to control everything
	return True
    #return update(dataset)


def update(dataset):
    return logged_in() and (current_user.admin or
                            current_user in dataset.managers)


def delete(dataset):
    return update(dataset)
